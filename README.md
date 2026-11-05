# OpenCrate Core

 [MIT license](./LICENSE) · 23 KB gzipped · [strict TypeScript](./tsconfig.json) · [0 dependencies](./package.json) · [tree-shakeable ESM](./package.json)

**A small, lightweight 3D engine for the web.** TypeScript and WebGL2, with an API that will feel familiar if you've spent time with Three.js , but scoped down to a minimal, production-quality engine that does one job well.

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

[Try the demo](./examples) · [Getting started](./docs/getting-started.md) · [API docs](./docs/api) · [Architecture & limitations](./docs/architecture.md)

---

## Why this exists

- **Zero runtime dependencies.** 
- **Tree-shakeable.** ESM with `"sideEffects": false`
- **Strict TypeScript, everywhere.** No `any` in public signatures. `tsc --noEmit` passes under `strict`.
- **Rendering is abstracted on purpose.** The scene graph, materials, and geometries never touch `gl` directly — only `WebGLDevice` does. That makes a future WebGPU backend a sibling device rather than a rewrite.
- **Allocation-conscious.** Once a scene stabilizes, the render loop and math library allocate nothing per frame
- **Small.** The entire public API gzips to about 23 KB.

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

Everything is re-exported from the package root — `import { Scene, Renderer } from '@opencrate/core'`. The table above is here so you can jump straight to the doc page for whatever you need.

## Documentation

- **[Getting started](./docs/getting-started.md)** — install, render loop, lighting, materials, textures, scene graph, controls, resizing, disposal, JSON loading. Start here.
- **[API reference](./docs/api)** — one page per module, covering every exported class.
- **[Architecture & design decisions](./docs/architecture.md)** — why the engine is built the way it is, and the v1 limitations you should know about before relying on something.
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


## License

MIT — see [LICENSE](./LICENSE).
