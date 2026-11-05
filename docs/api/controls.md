# `controls`

## `OrbitControls`

```ts
new OrbitControls(camera: Camera, domElement: HTMLElement, options?: OrbitControlsOptions)
```

Damped orbit/pan/zoom controller driving `camera` around `.target`, via Pointer Events
(unifying mouse + touch) and wheel.

```ts
interface OrbitControlsOptions {
  dampingFactor?: number;   // default 0.08
  rotateSpeed?: number;     // default 0.005
  zoomSpeed?: number;       // default 0.1
  panSpeed?: number;        // default 0.002
  minDistance?: number;     // default 0.5
  maxDistance?: number;     // default 500
  minPolarAngle?: number;   // default ~0 (radians, from +Y)
  maxPolarAngle?: number;   // default ~π (radians)
}
```

| Member | Notes |
|---|---|
| `.target: Vec3` | the point orbited around; default `(0, 0, 0)` |
| `.enabled: boolean` | set `false` to temporarily ignore input without disposing |
| `.update()` | **call once per frame**, before `renderer.render()` — applies damping and writes the result into `camera.position`/`camera.quaternion` |
| `.dispose()` | removes all pointer/wheel/contextmenu listeners from `domElement` |

```ts
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Input mapping

- **Left-drag** — orbit.
- **Right-drag, or Shift + left-drag** — pan.
- **Wheel, or two-finger pinch** — zoom (adjusts distance from `.target`, clamped to
  `minDistance`/`maxDistance`).

### Notes

- `OrbitControls` calls `camera.lookAt(target)` and `camera.markDirty()` internally every
  `.update()` — you don't need to manage the camera's transform yourself once controls are
  attached, but don't fight it by also setting `camera.position` elsewhere in your loop.
- Polar angle is clamped to `[minPolarAngle, maxPolarAngle]` to prevent the camera from
  flipping over the top/bottom pole — the defaults leave a small margin (~0.01 rad) rather
  than allowing exactly 0/π, which would make the azimuth direction ill-defined.
- Always call `.dispose()` when you tear down the scene/canvas, or the listeners (and the
  closure references they hold) leak.
