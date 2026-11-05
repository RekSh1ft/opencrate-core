# `renderer`

## `Renderer`

```ts
new Renderer(canvas: HTMLCanvasElement, options?: RendererOptions)
```

The public rendering entry point for almost all use cases — wraps a `WebGLDevice`.

```ts
interface RendererOptions {
  antialias?: boolean;      // default true
  alpha?: boolean;          // default false
  maxPixelRatio?: number;   // default 2 — clamps resolved devicePixelRatio
  devMode?: boolean;        // default false — logs draw-call counts via console.info
}
```

| Member | Notes |
|---|---|
| `.domElement: HTMLCanvasElement` | the canvas passed to the constructor |
| `.drawCallCount: number` | draw calls issued in the most recent `.render()` |
| `.autoClear: boolean` | default `true` — clears color+depth each `.render()` using `scene.background` |
| `.setSize(cssWidth, cssHeight)` | **the only resize entry point** — sets canvas backing-store size from CSS size × clamped DPR |
| `.render(scene, camera, target?)` | renders one frame; `target` is an optional `RenderTarget` (see caveat below) |
| `.dispose()` | |

```ts
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

> **`RenderTarget` caveat:** `.render()` accepts a `target` argument, but `WebGLDevice`
> currently always renders to the default framebuffer regardless — see
> [architecture.md](../architecture.md#known-limitations-v1). Don't rely on offscreen
> rendering yet.

## `WebGLDevice`

```ts
new WebGLDevice(canvas: HTMLCanvasElement, options?: WebGLDeviceOptions)
// WebGLDeviceOptions is the same shape as RendererOptions above
```

What `Renderer` wraps. You'd reach for this directly only if you're building a custom
render path that needs lower-level access than `Renderer.render()` gives you — e.g. a
multi-pass pipeline. It owns:

- **Context creation** — requests `'webgl2'`, throws if unavailable.
- **A GL state cache** — depth test/write, cull face mode, blend, bound program, bound VAO,
  and viewport are all tracked and only re-issued to `gl` when they actually change.
- **Resource caches**, each keyed per-device on the resource's own `_gpu` map: compiled
  `ShaderProgram`s (keyed by `(material.type, definesKey)`), uploaded textures, and geometry
  VAOs/buffers — so the same `Material`/`Texture`/`BufferGeometry` can be shared safely
  across multiple `WebGLDevice` instances.
- `.gl: WebGL2RenderingContext` — the raw context, if you need it.
- `.render(scene, camera, target?)` — same signature as `Renderer.render()`.
- `.logResourceCounts(label?)` — no-ops unless `devMode: true`.

See [architecture.md](../architecture.md#device-abstraction) for why the scene graph never
touches `gl` directly.

## `ShaderProgram`

```ts
new ShaderProgram(gl, vertexSource, fragmentSource, defines?)
```

Compiles and links a GLSL ES 3.00 vertex+fragment pair, with `#define` injection and uniform/
attribute introspection. You won't normally construct this yourself — `WebGLDevice` does, per
material, and caches the result.

- Compile/link errors throw with the **GLSL source annotated by line number** inline in the
  error message, so a compile failure points you straight at the offending line.
- `.setUniform(name, value)` — skips the `gl.uniform*` call if the cached value is unchanged.
  Silently no-ops for a uniform the compiler optimized out (not a programmer error — a
  material may probe speculatively for uniforms that aren't present in every variant).
- `.setUniformArray(name, flatValues)` — for array uniforms (e.g. `vec3[N]`), bypassing
  single-value change detection.
- `.hasUniform(name)` / `.getAttributeLocation(name)` / `.use()` / `.dispose()`.

## `RenderTarget`

```ts
new RenderTarget(width: number, height: number, depthBuffer = true)
```

CPU-side description of an offscreen render target. `.setSize(width, height)` bumps
`.version` if the size actually changed. `.dispose()`. See the caveat under `Renderer` above
— not yet backed by a real framebuffer in v1.

## `RenderList`

```ts
new RenderList()
```

Gathers, frustum-culls, and depth-sorts a frame's visible `Mesh`/`Line`/`Points` into
`.opaque` and `.transparent` arrays (front-to-back and back-to-front respectively — see
[architecture.md](../architecture.md#sort-order)). `Renderer`/`WebGLDevice` owns one of these
internally and calls `.gather(scene, camera, frustumCull?)` once per frame; you'd only
instantiate your own for a custom render path. Entries are pooled across frames via
`.reset()` — no per-frame array allocation once a scene's object count stabilizes.
