# Getting started

This walks through everything you need to go from an empty canvas to an animated, lit,
textured scene with orbit controls. For the full prop/method list of any class mentioned
here, see the [API reference](./api).

## 1. Minimal setup

```ts
import { Scene, PerspectiveCamera, Renderer, Mesh, BoxGeometry, BasicMaterial } from '@opencrate/core';

const canvas = document.querySelector('canvas')!;
const renderer = new Renderer(canvas);

const scene = new Scene();
const camera = new PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const cube = new Mesh(new BoxGeometry(), new BasicMaterial());
scene.add(cube);

renderer.setSize(innerWidth, innerHeight);
renderer.render(scene, camera);
```

This draws one flat-colored cube, once. `renderer.render()` renders exactly one frame — it
doesn't start a loop for you.

## 2. The render loop

Drive the loop yourself with `requestAnimationFrame`, and use `Clock` for frame-rate-independent
motion:

```ts
import { Clock } from '@opencrate/core';

const clock = new Clock();
clock.start();

function animate() {
  const dt = clock.getDelta(); // seconds since the previous call

  cube.quaternion.multiplyQuats(cube.quaternion, someSpinQuat(dt));
  cube.markDirty(); // see below

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

### The dirty-flag rule

`Object3D` only recomputes its matrix when it knows something changed. The convenience
setters (`setPosition`, `setRotationFromEuler`, `setScale`) call `markDirty()` for you.
If you mutate `.position`, `.quaternion`, or `.scale` **directly** — which is normal and
expected (`mesh.position.set(1, 2, 3)` is the documented style) — you must call
`mesh.markDirty()` yourself afterward. This is a deliberate trade-off: no proxies, no hidden
`Object.defineProperty` magic, no surprise cost on every field write — just one explicit call
when you're done mutating a transform for the frame.

```ts
mesh.position.x += 1;
mesh.markDirty(); // required
```

## 3. Lighting

`BasicMaterial` is unlit and needs no lights. `LambertMaterial` and `StandardMaterial` do:

```ts
import { AmbientLight, DirectionalLight, PointLight, Color } from '@opencrate/core';

scene.add(new AmbientLight(new Color(1, 1, 1), 0.15));

const sun = new DirectionalLight(new Color(1, 0.96, 0.9), 1.0);
sun.position.set(5, 8, 3); // direction is derived from position -> target (default: origin)
scene.add(sun);

const lamp = new PointLight(new Color(0.4, 0.6, 1), 2.0, 12); // color, intensity, range
lamp.position.set(-3, 2, -2);
scene.add(lamp);
```

`StandardMaterial` sees ambient + one directional light + up to 4 point lights
(`MAX_POINT_LIGHTS`, exported from `@opencrate/core`). `LambertMaterial` sees ambient + one
directional light only. `SpotLight` exists on the object model but isn't yet sampled by any
shader — see [architecture.md](./architecture.md#known-limitations-v1).

## 4. Materials

```ts
new BasicMaterial({ color, map, vertexColors, wireframe, transparent, opacity });
new LambertMaterial({ color, map, transparent, opacity });
new StandardMaterial({ color, map, metalness, roughness, transparent, opacity });
```

All constructor options are optional. Materials and geometries are **referenced, not
copied** when you pass them to a `Mesh` — share one `BasicMaterial` instance across 500
meshes and they'll share one compiled shader program. Call `.clone()` explicitly when you
need an independent copy (e.g. to fade one mesh's opacity without affecting its siblings).

## 5. Textures

```ts
import { TextureLoader, DataTexture } from '@opencrate/core';

const loader = new TextureLoader();
const brick = await loader.load('/textures/brick.png');
mesh.material.setMap(brick); // or pass `map: brick` in the constructor options
```

Procedural textures, without an image file:

```ts
const data = new Uint8ClampedArray(width * height * 4); // fill with RGBA bytes
const proceduralTex = new DataTexture(data, width, height);
```

## 6. Scene graph

```ts
import { Group } from '@opencrate/core';

const rig = new Group();
rig.add(cube, lamp);
scene.add(rig);

rig.position.set(1, 0, 0);
rig.markDirty(); // same rule as above — Group is an Object3D
```

- `object.traverse(fn)` / `object.traverseVisible(fn)` walk the subtree.
- `object.remove(child)` / `child.removeFromParent()` detach a node.
- `object.add(...)` re-parents automatically — adding a node that already has a parent
  removes it from the old parent first.

## 7. Orbit camera controls

```ts
import { OrbitControls } from '@opencrate/core';

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

// inside the render loop, before renderer.render():
controls.update();
```

Left-drag orbits, right-drag (or shift+drag) pans, wheel/pinch zooms. Call
`controls.dispose()` when you tear down the scene, to remove its pointer/wheel listeners.

## 8. Resizing

```ts
window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.setAspectFromSize(innerWidth, innerHeight);
});
```

`renderer.setSize()` is the **only** resize entry point — per the engine's API style guide,
there's no separate DPR knob to remember to call; it clamps device-pixel-ratio internally
(`maxPixelRatio` in the `Renderer`/`WebGLDevice` constructor options, default `2`).

## 9. Disposal

Every class that owns GPU resources has a `dispose()`:

```ts
mesh.dispose();      // releases this mesh's own geometry + material GPU resources
renderer.dispose();
controls.dispose();  // removes pointer/wheel listeners
```

`Mesh.dispose()` disposes its geometry and material by default, even if they're shared with
other meshes — pass `mesh.dispose(false)` if you're sharing a geometry/material across
multiple meshes and want to dispose this mesh's node without releasing resources the others
still need.

## 10. Loading/saving a scene as JSON

```ts
import { ObjectLoader } from '@opencrate/core';

const loader = new ObjectLoader();
const json = loader.toJSON(scene);      // geometry referenced by name + primitive params
const restored = loader.parse(json);
```

Only the five built-in primitive geometries (`Box`, `Sphere`, `Plane`, `Cylinder`, `Torus`)
round-trip through `toJSON`/`parse` in v1 — see
[architecture.md](./architecture.md#known-limitations-v1).

## Where to go next

- Read `examples/main.ts` in this repo — a complete, runnable version of everything above.
- Browse the [API reference](./api) for the full method/property list of any class.
- Read [architecture.md](./architecture.md) before relying on shadows, IBL, spot lights, or
  instancing — none of those are in v1, and that page explains what to reach for instead.
