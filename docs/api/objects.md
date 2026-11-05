# `objects`

All of these extend `Object3D` ([core.md](./core.md)) — everything there (transform,
hierarchy, events, `markDirty()`) applies.

## `Mesh`

```ts
new Mesh(geometry: BufferGeometry, material: Material)
```

Renderable triangle mesh. `.geometry` and `.material` are public and swappable at runtime —
referenced, not copied, so reassigning them is cheap and shares GPU resources with whatever
else references the same instances. `.drawMode: 'triangles' | 'lines' | 'points'` (default
`'triangles'`).

`.dispose(includeShared = true)` — releases this mesh's geometry and material GPU resources
by default. Pass `false` if the geometry/material is shared with other meshes you don't want
disposed yet.

## `Line`

```ts
new Line(geometry: BufferGeometry, material: Material)
```

Renders as `LINE_STRIP`. Same `geometry`/`material` referencing and `dispose(includeShared?)`
behavior as `Mesh`.

## `Points`

```ts
new Points(geometry: BufferGeometry, material: Material)
```

Renders as `POINTS`. Has an additional `.size: number` (default `1`) — not currently read by
any built-in material shader (point-size shading is left to custom materials). Same
`dispose(includeShared?)` behavior as `Mesh`.

## `Group`

```ts
new Group()
```

A transform-only container with no renderable payload of its own — use it to group objects
under a shared parent transform (move/rotate/scale several meshes together).

## `Camera`

```ts
abstract class Camera extends Object3D
```

Base class for `PerspectiveCamera` and `OrthographicCamera`. You won't instantiate this
directly.

| Property | Notes |
|---|---|
| `.projectionMatrix: Mat4` | set by `.updateProjectionMatrix()` |
| `.viewMatrix: Mat4` | set by `.updateViewMatrix()` |
| `.viewProjectionMatrix: Mat4` | `projection * view`, recomputed by `.getFrustum()` |

| Method | Notes |
|---|---|
| `.updateProjectionMatrix()` | **abstract** — implemented by each subclass |
| `.updateViewMatrix()` | inverts the camera's current `.matrixWorld`; call after `updateMatrixWorld()` |
| `.getFrustum(out?)` | recomputes `.viewProjectionMatrix` and returns a `Frustum` derived from it (reuses `out` if passed — no allocation on repeat calls) |

`Renderer.render()` calls `updateMatrixWorld()`, `updateViewMatrix()`, and gathers the
frustum for you every frame — you only need these directly for custom render paths.

## `PerspectiveCamera`

```ts
new PerspectiveCamera(fov = 50, aspect = 1, near = 0.1, far = 2000) // extends Camera
```

`fov` is the **full vertical field of view, in degrees**. `.fov` / `.aspect` / `.near` /
`.far` are public; after changing any of them, call `.updateProjectionMatrix()` (or use the
convenience below, which does it for you):

```ts
camera.setAspectFromSize(window.innerWidth, window.innerHeight);
```

## `OrthographicCamera`

```ts
new OrthographicCamera(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000)
// extends Camera
```

Defined by a view-space box. `.left` / `.right` / `.top` / `.bottom` / `.near` / `.far` are
public; call `.updateProjectionMatrix()` after changing any of them.
