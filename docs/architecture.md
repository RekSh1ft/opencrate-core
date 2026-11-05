# Architecture & design decisions

## Device abstraction

All GPU calls go through `WebGLDevice`, which `Renderer` wraps. The scene graph, materials,
and geometries never touch `gl` directly — only `WebGLDevice` does. This means:

- A future `WebGPUDevice` can be dropped in alongside `WebGLDevice` without changing
  `Object3D`, `Mesh`, `Material`, or `BufferGeometry`.
- Resource caching (compiled programs, uploaded textures, VAOs) is keyed **per device
  instance** on each resource's own `_gpu` map, so the same `BufferGeometry` or `Material`
  can safely be shared across two separate canvases/devices.

## Mutate-and-chain math

Every method on `Vec2`/`Vec3`/`Vec4`/`Mat3`/`Mat4`/`Quat`/`Color`/`Rect` mutates `this` and
returns `this` (the Three.js convention), with class-static scratch instances for internal
computation (e.g. `Mat4.multiplyMatrices` uses a private static temp buffer rather than
allocating). Composing a frame's worth of transforms allocates nothing.

## Dirty-flag propagation

`Object3D.markDirty()` flags only the local matrix as needing recompute; world-matrix
recomputation walks down from `updateMatrixWorld()`, and a subtree whose world matrix is
already current is skipped entirely. A scene with mostly-static geometry does near-zero
matrix math per frame — only nodes that changed (and their descendants) get recomputed.

This is also why direct mutation of `.position`/`.quaternion`/`.scale` requires an explicit
`markDirty()` call afterward (see [getting-started.md](./getting-started.md#the-dirty-flag-rule)):
the engine has no way to observe a field write without a proxy, and proxies would add
per-field-access overhead to every transform in the scene, for every frame, forever — a cost
paid in the hot path to save one line of code in the cold path.

## Program cache keyed by (material type, defines)

`Material` owns GLSL source as template literals with `#define` feature-flag injection
(`USE_MAP`, `USE_VERTEX_COLORS`, `MAX_POINT_LIGHTS`, ...). `WebGLDevice` compiles a
`ShaderProgram` once per distinct `(material.type, definesKey)` pair and reuses it across
every mesh sharing that material shape — two `BasicMaterial` instances with a map bound
compile to and share the same program; a third without a map compiles (and caches) a second,
smaller variant.

## Uniform change-detection

`ShaderProgram.setUniform()` caches the last-uploaded value per uniform and skips the
`gl.uniform*` call when nothing changed. This matters most for uniforms that are often
constant frame-to-frame (`u_projectionMatrix` when the camera isn't moving, light colors
when lighting is static) — the comparison cost is far cheaper than the driver call it elides.

## RenderList pooling

`RenderList` keeps two preallocated arrays (opaque/transparent) and a free-list of
`Renderable` slot objects, reused frame to frame via `reset()`. Gathering and sorting a
frame's draw list allocates no new objects once the scene has stabilized at a given object
count — new slots are only created the first time the list needs to grow.

## Frustum culling

`BufferGeometry.computeBoundingSphere()` uses a cheap O(n) centroid + max-extent
approximation, not a minimal enclosing sphere (e.g. Ritter's or Welzl's algorithm). This is
adequate for view-frustum culling (a looser bound just culls slightly less aggressively) but
is **not** a tight bound — don't reuse it for anything that needs a minimal sphere, like
collision broad-phase.

`RenderList.gather()` transforms each mesh's local bounding sphere into world space (center
via the world matrix, radius scaled by the matrix's largest axis scale) and tests it against
a `Frustum` derived from the camera's view-projection matrix once per frame.

## Sort order

- **Opaque:** front-to-back (ascending camera-distance), to maximize early-z rejection on
  the GPU — fragments behind already-drawn opaque geometry are rejected before shading.
- **Transparent:** back-to-front (descending camera-distance), required for correct alpha
  blending regardless of early-z.

Distance is measured as squared Euclidean distance from the camera to each object's world
position (not a true per-triangle depth sort), which is standard practice and matches what
most real-time engines do for mesh-granularity sorting.

## Quaternion-first rotation

Per the engine's API style guide, `quaternion` is the single source of truth for orientation.
`Object3D.rotation` is a **non-cached** Euler *view*, decomposed from the quaternion via
matrix extraction on every read. Prefer `.quaternion` / `setRotationFromEuler()` in any code
that runs every frame — reading `.rotation` does real trigonometry (`asin`/`atan2`) on every
access, by design, rather than maintaining a second piece of state that could drift out of
sync with the quaternion.

## Fixed attribute locations

Every built-in material's vertex shader uses the same `layout(location = N)` bindings:
`position = 0`, `normal = 1`, `uv = 2`, `color = 3`. This means `BufferGeometry`'s VAO setup
doesn't need to know which program will eventually draw it — attributes bind to fixed slots
regardless of which material a mesh ends up using.

## Why not instancing?

The spec target of "≥5,000 draw calls at 60 fps on integrated graphics" is addressed in v1
through frustum culling + front-to-back opaque sorting + program/uniform/state caching in
`WebGLDevice`, not through GPU instancing. An `InstancedMesh` is a natural, self-contained
addition for scenes with large counts of *repeated* geometry (the same mesh drawn thousands
of times with different transforms) and is deliberately left out of this core so it can live
in a sibling `@opencrate/*` package without the core needing to anticipate its uniform-buffer
layout today.

---

## Known limitations (v1)

These are intentional scope cuts, not bugs. Each is a reasonable next addition, called out so
you don't spend time working around something that's simply not built yet.

- **No shadow mapping.** `castShadow` / `receiveShadow` flags exist on `Object3D` but nothing
  reads them yet — reserved for a future shadow pass.
- **`StandardMaterial` has no IBL (image-based lighting).** Ambient is a flat per-scene term,
  not a convolved environment map; you get specular highlights from direct lights, not
  reflections of the environment.
- **`SpotLight` is modeled but not sampled.** `AmbientLight`, `DirectionalLight`, and
  `PointLight` (up to `MAX_POINT_LIGHTS = 4`) are wired end-to-end into `WebGLDevice` and the
  material shaders; `SpotLight` exists as a class (position/target/angle/penumbra/range) for
  downstream packages to build on, but no shipped material shades with it yet.
- **`RenderTarget` doesn't back a real framebuffer yet.** `Renderer.render(scene, camera,
  target)` accepts a `RenderTarget`, but `WebGLDevice.render()` currently always renders to
  the default framebuffer. The CPU-side `RenderTarget` description (size, depth buffer flag,
  resize versioning) is in place for a follow-up pass to wire up
  `gl.framebufferTexture2D`/renderbuffers.
- **`Object3D.rotation` read-back is exact for `XYZ`/`YXZ`/`ZXY` only.** The other three Euler
  orders (`ZYX`, `YZX`, `XZY`) fall back to an `XYZ`-style extraction when you *read*
  `.rotation`. `Quat.fromEuler()` (writing) supports all six orders correctly — only the
  convenience getter is limited.
- **`ObjectLoader` only round-trips the five built-in primitive geometries** (`Box`,
  `Sphere`, `Plane`, `Cylinder`, `Torus`) via their constructor parameters. An arbitrary
  `BufferGeometry` (e.g. a loaded mesh with custom vertex data) isn't serializable through
  `toJSON`/`parse` in v1.
- **No GPU instancing.** See [Why not instancing?](#why-not-instancing) above.
- **`DataTexture` mip-mapping assumes power-of-two dimensions.** Non-POT `DataTexture`s fall
  back to non-mipmapped, `CLAMP_TO_EDGE`-compatible filtering (WebGL2 relaxes the POT
  requirement in that specific case).
- **Math test coverage is a smoke suite, not a property-based test suite.**
  `src/math/math.test.ts` checks the identities the renderer actually depends on being
  correct (multiply/invert/compose-decompose round-trips, perspective matrix shape, an
  Euler↔Quat↔Mat4 round-trip) via `console.assert`, run with `npm run test:math`. It is not
  exhaustive coverage of every method on every math class.

If you hit one of these and need it now, the usual path is a small sibling `@opencrate/*`
package or a local subclass — the device/material/geometry boundaries described above exist
specifically so that's possible without forking the core.
