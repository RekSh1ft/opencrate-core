# `core`

## `Object3D`

Base class of the scene graph. `Scene`, `Mesh`, `Line`, `Points`, `Group`, `Camera`, and every
light extend it.

```ts
new Object3D()
```

### Transform

| Property | Notes |
|---|---|
| `.position: Vec3` | |
| `.quaternion: Quat` | source of truth for rotation |
| `.scale: Vec3` | |
| `.rotation: Euler` *(getter)* | non-cached Euler view decomposed from `.quaternion` on every read — see [architecture.md](../architecture.md#quaternion-first-rotation) |
| `.rotationOrder: EulerOrder` | which order `.rotation`'s getter decomposes into (default `'XYZ'`) |
| `.matrix: Mat4` | local transform, recomputed lazily |
| `.matrixWorld: Mat4` | world transform, recomputed lazily |

| Method | Notes |
|---|---|
| `.setPosition(x, y, z)` / `.setScale(x, y, z)` | convenience setters that also call `markDirty()` |
| `.setRotationFromEuler(e)` | sets `.quaternion` from an `Euler` and records `.rotationOrder` |
| `.markDirty()` | **call this after any direct mutation** of `.position`/`.quaternion`/`.scale` — see [getting-started.md](../getting-started.md#the-dirty-flag-rule) |
| `.updateMatrix()` | recomputes `.matrix` if dirty (called internally; rarely needed directly) |
| `.updateMatrixWorld(parentWorldDirty?)` | recomputes `.matrixWorld` for this node and its subtree; call once per frame from the root (`Scene`/`Renderer` does this for you during `render()`) |
| `.lookAt(target: Vec3)` | orients `.quaternion` to face `target` from the current world position |
| `.getWorldPosition(out: Vec3)` | updates world matrix first, writes world-space position into `out` |

### Hierarchy

| Method | Notes |
|---|---|
| `.add(...objects)` | re-parents automatically (removes from previous parent first) |
| `.remove(...objects)` | |
| `.removeFromParent()` | |
| `.traverse(fn)` | visits this node and every descendant, regardless of `.visible` |
| `.traverseVisible(fn)` | stops descending into subtrees where `.visible === false` |
| `.parent: Object3D \| null` | |
| `.children: Object3D[]` | |

### Other properties

`.id: number` (auto-incrementing, unique per process), `.name: string`, `.visible: boolean`
(default `true`), `.castShadow` / `.receiveShadow: boolean` (reserved — see
[architecture.md](../architecture.md#known-limitations-v1)), `.userData: Record<string,
unknown>` (never read or written by the engine itself).

### Events

`Object3D extends EventDispatcher` with a built-in event map: `'added'`, `'removed'` (fired
on the child), `'childadded'` / `'childremoved'` (fired on the parent, with `{ child }`).

```ts
mesh.addEventListener('added', () => console.log('now in a scene graph'));
```

### Cloning & disposal

`.clone(recursive = true)` / `.copy(source, recursive = true)` — copies transform,
visibility, name; recursively clones children by default. `.dispose()` — base implementation
recurses into children; `Mesh`/`Line`/`Points` override it to also release their
geometry/material GPU resources (see [objects.md](./objects.md)).

---

## `Scene`

```ts
new Scene() // extends Object3D
```

The root of a scene graph. Adds:

- `.background: Color` — clear color, read by `Renderer`/`WebGLDevice` each frame.
- `.ambient: Color` — scene-wide ambient term, added to any `AmbientLight`s present.

---

## `EventDispatcher`

```ts
class EventDispatcher<EventMap extends Record<string, EngineEvent> = Record<string, EngineEvent>>
```

Minimal typed pub/sub with no global state — every instance has its own listener map.
`.addEventListener(type, listener)` / `.removeEventListener(type, listener)` /
`.hasEventListener(type, listener)` / `.dispatchEvent(event)`. `Object3D` extends this
directly; you can also extend it yourself for a custom event-emitting class.

---

## `Clock`

```ts
new Clock()
```

Frame timing. `.start()` resets elapsed time and begins tracking; `.stop()` freezes it;
`.getDelta()` returns seconds since the previous call (or since `start()`) **and advances
internal state** — call it exactly once per frame; `.getElapsed()` returns total seconds
since `start()` without advancing anything.

---

## `Timer`

```ts
new Timer(intervalSeconds: number)
```

Accumulator for throttling per-frame work to a fixed rate (e.g. "step physics at 60 Hz
regardless of render frame rate"). `.tick(dt)` adds `dt` to an internal accumulator and
returns how many whole `interval`s have elapsed since the last call (0 if none yet — use this
in a `while` loop if you need to catch up after a stall). `.reset()` clears the accumulator.

```ts
const physicsTimer = new Timer(1 / 60);
// in the render loop:
const steps = physicsTimer.tick(dt);
for (let i = 0; i < steps; i++) stepPhysics(1 / 60);
```
