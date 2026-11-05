# API reference

One page per module. Every class here is re-exported from the package root — these pages
exist for navigation, not because the import path differs:

```ts
import { Vec3, Scene, Mesh, BoxGeometry, StandardMaterial } from '@opencrate/core';
```

| Page | Covers |
|---|---|
| [math.md](./math.md) | `Vec2` `Vec3` `Vec4` `Mat3` `Mat4` `Quat` `Euler` `Color` `Rect` `Sphere` `Frustum` |
| [core.md](./core.md) | `Object3D` `Scene` `EventDispatcher` `Clock` `Timer` |
| [objects.md](./objects.md) | `Mesh` `Line` `Points` `Group` `Camera` `PerspectiveCamera` `OrthographicCamera` |
| [geometry.md](./geometry.md) | `BufferGeometry` `BufferAttribute` + primitives |
| [materials.md](./materials.md) | `Material` `BasicMaterial` `LambertMaterial` `StandardMaterial` |
| [textures.md](./textures.md) | `Texture` `DataTexture` `CubeTexture` |
| [lights.md](./lights.md) | `AmbientLight` `DirectionalLight` `PointLight` `SpotLight` |
| [loaders.md](./loaders.md) | `TextureLoader` `ObjectLoader` |
| [renderer.md](./renderer.md) | `Renderer` `WebGLDevice` `ShaderProgram` `RenderTarget` `RenderList` |
| [controls.md](./controls.md) | `OrbitControls` |

New to the engine? Read [getting-started.md](../getting-started.md) first — it's task-oriented
rather than class-by-class.
