# OpenCrate Core

**3D engine core for the browser.** Clean API, modular, tree-shakeable, zero runtime
dependencies, strict TypeScript, WebGL2 — in the spirit of Three.js, scoped to a minimal
production-quality core.

```ts
import { Scene, PerspectiveCamera, Renderer, Mesh, BoxGeometry, BasicMaterial } from '@opencrate/core';

const renderer = new Renderer(document.querySelector('canvas')!);
const scene = new Scene();
const camera = new PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const cube = new Mesh(new BoxGeometry(), new BasicMaterial());
scene.add(cube);

renderer.setSize(innerWidth, innerHeight);
renderer.render(scene, camera);
```

[**Try the live demo**](./examples) · [**Getting started**](./docs/getting-started.md) · [**API docs**](./docs/api) · [**Architecture & limitations**](./docs/architecture.md)

---

## Why OpenCrate Core

- **Zero runtime dependencies.** Nothing to audit, nothing to version-bump.
- **Tree-shakeable.** `"sideEffects": false` + ESM — import only what you use.
- **Strict TypeScript.** No `any` in public signatures; `tsc --noEmit` passes `strict`.
- **Device-abstracted rendering.** The scene graph, materials, and geometries never touch
  `gl` directly — only `WebGLDevice` does — so a future WebGPU backend is a sibling device,
  not a rewrite.
- **Allocation-conscious.** The render loop and math library are written to allocate nothing
  per frame once a scene has stabilized (scratch statics, pooled render lists, cached uniforms).
- **Small.** The entire public API gzips to ~23 KB.

## Install

```bash
npm install @opencrate/core
```

Working from this repo directly:

```bash
git clone https://github.com/opencrate/opencrate-core.git
cd opencrate-core
npm install
npm run dev      # launches the example scene
```

## What's inside

| Module | Exports |
|---|---|
| [`math`](./docs/api/math.md) | `Vec2` `Vec3` `Vec4` `Mat3` `Mat4` `Quat` `Euler` `Color` `Rect` `Sphere` `Frustum` |
| [`core`](./docs/api/core.md) | `Object3D` `Scene` `EventDispatcher` `Clock` `Timer` |
| [`objects`](./docs/api/objects.md) | `Mesh` `Line` `Points` `Group` `Camera` `PerspectiveCamera` `OrthographicCamera` |
| [`geometry`](./docs/api/geometry.md) | `BufferGeometry` `BoxGeometry` `SphereGeometry` `PlaneGeometry` `CylinderGeometry` `TorusGeometry` |
| [`material`](./docs/api/materials.md) | `Material` `BasicMaterial` `LambertMaterial` `StandardMaterial` |
| [`textures`](./docs/api/textures.md) | `Texture` `DataTexture` `CubeTexture` |
| [`lights`](./docs/api/lights.md) | `AmbientLight` `DirectionalLight` `PointLight` `SpotLight` |
| [`loaders`](./docs/api/loaders.md) | `TextureLoader` `ObjectLoader` |
| [`renderer`](./docs/api/renderer.md) | `Renderer` `WebGLDevice` `ShaderProgram` `RenderTarget` `RenderList` |
| [`controls`](./docs/api/controls.md) | `OrbitControls` |

Everything is re-exported from the package root (`import { X } from '@opencrate/core'`); the
table above exists so you can jump straight to the doc page for the thing you need.

## Documentation

- **[Getting started](./docs/getting-started.md)** — install, render loop, lighting, materials,
  textures, scene graph, controls, resizing, disposal, JSON loading. Start here.
- **[API reference](./docs/api)** — one page per module, covering every exported class.
- **[Architecture & design decisions](./docs/architecture.md)** — why the engine is built the
  way it is, and the v1 limitations you should know about before relying on something.
- **[Contributing](./docs/CONTRIBUTING.md)** — project layout, scripts, coding conventions.

## Project layout

```
src/
  math/        Vec2 Vec3 Vec4 Quat Mat3 Mat4 Euler Color Rect Sphere Frustum
  core/        Object3D Scene EventDispatcher Clock Timer
  objects/     Mesh Line Points Group Camera PerspectiveCamera OrthographicCamera
  geometry/    BufferGeometry + primitives: Box, Sphere, Plane, Cylinder, Torus
  material/    Material (base), BasicMaterial, LambertMaterial, StandardMaterial (PBR-lite)
  renderer/    Renderer, WebGLDevice, ShaderProgram, RenderTarget, RenderList
  textures/    Texture, DataTexture, CubeTexture
  lights/      AmbientLight, DirectionalLight, PointLight, SpotLight
  loaders/     ObjectLoader (JSON), TextureLoader
  controls/    OrbitControls
  index.ts     Public barrel export
examples/      one HTML page + main.ts demonstrating every subsystem
docs/          getting-started guide, per-module API reference, architecture notes
```

## Scripts

```bash
npm run dev          # Vite dev server, opens examples/index.html
npm run build         # tree-shakeable ESM bundle -> dist/
npm run build:size    # build, then print the gzipped bundle size
npm run typecheck     # tsc --noEmit, strict
npm run test:math     # plain-assertion math smoke tests (tsx)
```

## Extending

Physics, audio, and loader packs are expected to live in sibling `@opencrate/*` packages
rather than in this core. `@opencrate/core` intentionally stays free of anything that would
block that — no global singletons, no hidden coupling between the renderer and any one
material or light set.

## License

MIT — see [LICENSE](./LICENSE).
