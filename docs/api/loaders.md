# `loaders`

## `TextureLoader`

```ts
new TextureLoader()
```

Loads an `HTMLImageElement` from a URL and wraps it in a `Texture`. `.crossOrigin: string`
(default `'anonymous'`).

```ts
const loader = new TextureLoader();
const tex = await loader.load('/textures/brick.png');   // rejects on load error
const [a, b] = await loader.loadAll(['/a.png', '/b.png']);
```

## `ObjectLoader`

```ts
new ObjectLoader()
```

Serializes/deserializes a `Scene` to/from a plain-JSON representation: geometries referenced
by name + primitive constructor params, materials inlined, transforms and hierarchy
preserved.

```ts
const loader = new ObjectLoader();

const json = loader.toJSON(scene);   // SceneJSON — plain object, JSON.stringify-able
const restored = loader.parse(json); // -> Scene
```

### `SceneJSON` shape

```ts
interface SceneJSON {
  background?: [number, number, number];
  geometries: Record<string, { type: 'Box' | 'Sphere' | 'Plane' | 'Cylinder' | 'Torus'; params: number[] }>;
  root: {
    type: 'Group' | 'Mesh' | 'Object3D';
    name?: string;
    position?: [number, number, number];
    quaternion?: [number, number, number, number];
    scale?: [number, number, number];
    visible?: boolean;
    geometry?: string;           // key into `geometries`
    material?: {
      type: 'BasicMaterial' | 'LambertMaterial' | 'StandardMaterial';
      color?: [number, number, number];
      opacity?: number;
      transparent?: boolean;
      metalness?: number;
      roughness?: number;
    };
    children?: /* same shape, recursive */ [];
  };
}
```

### What round-trips

- **Geometry:** only the five built-in primitives (`BoxGeometry`, `SphereGeometry`,
  `PlaneGeometry`, `CylinderGeometry`, `TorusGeometry`), via their constructor parameters.
  An arbitrary `BufferGeometry` (custom vertex data, a loaded mesh) is **not** serializable
  through `toJSON` in v1 — see [architecture.md](../architecture.md#known-limitations-v1).
- **Materials:** `BasicMaterial`, `LambertMaterial`, `StandardMaterial` — color, opacity,
  transparency, and (for `StandardMaterial`) metalness/roughness. Textures are not
  serialized; a round-tripped mesh loses its `.map`.
- **Hierarchy:** `Group`, `Mesh`, and plain `Object3D` nodes, with full transform
  (position/quaternion/scale), visibility, and nesting.

If you need to serialize a geometry type `ObjectLoader` doesn't know about, extend the
`buildGeometry()`/`geometryToJSON()` switch in `src/loaders/ObjectLoader.ts` — see
[CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-new-primitive-geometry).
