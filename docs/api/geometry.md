# `geometry`

## `BufferGeometry`

```ts
new BufferGeometry()
```

CPU-side mesh data: named vertex attributes plus an optional index buffer. The renderer
lazily creates and caches a WebGL VAO per `(device, geometry)` pair — you never touch GL
objects directly here.

| Method | Notes |
|---|---|
| `.setAttribute(name, attribute: BufferAttribute)` | conventional names: `'position'`, `'normal'`, `'uv'`, `'color'` — these map to the fixed shader attribute locations (see [architecture.md](../architecture.md#fixed-attribute-locations)) |
| `.getAttribute(name)` / `.deleteAttribute(name)` | |
| `.setIndex(index: BufferAttribute \| number[] \| null)` | passing a plain `number[]` auto-picks `Uint16Array` or `Uint32Array` based on the max index |
| `.setDrawRange(start, count)` | restricts drawing to a sub-range (default: the whole buffer) |
| `.vertexCount` / `.indexCount` *(getters)* | |
| `.computeBoundingSphere()` | populates `.boundingSphere` from the `'position'` attribute — call after mutating positions |
| `.boundingSphere: Sphere` | used by `RenderList` for frustum culling |
| `.dispose()` | clears this geometry's per-device GPU cache entries |

## `BufferAttribute`

```ts
new BufferAttribute(array: TypedArray, itemSize: number, normalized = false)
```

`TypedArray = Float32Array | Uint16Array | Uint32Array | Int16Array | Uint8Array`.
`.count` *(getter)* = `array.length / itemSize`. `.version` is bumped automatically by
`needsUpdate()` — call it after mutating `.array` in place so the device knows to re-upload:

```ts
positionAttr.array[0] = 1.5;
positionAttr.needsUpdate();
geometry.computeBoundingSphere(); // if the change affects the bounds
```

## Primitives

All five extend `BufferGeometry`, compute correct normals/UVs/indices, call
`computeBoundingSphere()` in their constructor, and stash their constructor arguments on a
`readonly params: number[]` field (used by `ObjectLoader` for JSON round-tripping).

| Class | Constructor | Notes |
|---|---|---|
| `BoxGeometry` | `(width = 1, height = 1, depth = 1)` | centered at the origin, per-face normals |
| `SphereGeometry` | `(radius = 1, widthSegments = 32, heightSegments = 16)` | UV sphere |
| `PlaneGeometry` | `(width = 1, height = 1, widthSegments = 1, heightSegments = 1)` | flat grid in the XY plane, normal `+Z`, centered at the origin |
| `CylinderGeometry` | `(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 32, heightSegments = 1, openEnded = false)` | axis along `+Y`; pass `radiusTop = 0` for a cone; end caps unless `openEnded` |
| `TorusGeometry` | `(radius = 1, tube = 0.4, radialSegments = 16, tubularSegments = 48)` | in the XY plane, centered at the origin |

```ts
const box = new BoxGeometry(2, 1, 1);
const cone = new CylinderGeometry(0, 1, 2, 24); // radiusTop = 0 -> cone
```

Writing your own geometry (custom vertex data, a loaded mesh, procedural terrain): extend
`BufferGeometry` directly and set attributes yourself — see
[CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-new-primitive-geometry) for the pattern, though
you don't need to follow the primitive-params convention unless you also want `ObjectLoader`
round-tripping.
