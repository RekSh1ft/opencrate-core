# `material`

## `Material` (base, abstract)

Every material extends this. You won't instantiate it directly, but every subclass shares
these properties:

| Property | Default | Notes |
|---|---|---|
| `.type: string` | — | class name; forms the program-cache key alongside `defines` |
| `.name: string` | `''` | |
| `.transparent: boolean` | `false` | enables alpha blending and moves the mesh into the back-to-front render pass |
| `.opacity: number` | `1` | |
| `.wireframe: boolean` | `false` | |
| `.depthTest: boolean` | `true` | |
| `.depthWrite: boolean` | `true` | |
| `.side: 'front' \| 'back' \| 'double'` | `'front'` | backface culling mode |
| `.defines: Record<string, boolean \| string \| number>` | `{}` | `#define` feature flags injected into shader source |

`.getDefinesKey()` returns a stable string from `.defines`, used by `WebGLDevice`'s program
cache. `.needsUniformUpdate()` bumps a version counter for uniform-only changes (no
recompile). `.dispose()` clears this material's per-device compiled-program cache entries.

Subclasses set feature flags via a protected `setDefine(key, value)` — passing `false` or
`undefined` removes the define; any other value sets it and bumps `.programVersion`,
triggering a recompile on the next draw.

## `BasicMaterial`

```ts
new BasicMaterial({ color, map, vertexColors, wireframe, transparent, opacity } = {})
```

Unlit: flat `.color: Color`, optional `.map: Texture`, optional `.vertexColors: boolean`
(multiplies in a per-vertex `'color'` attribute if present on the geometry). Use
`.setMap(texture | undefined)` to change the map after construction (keeps the define flag
in sync).

## `LambertMaterial`

```ts
new LambertMaterial({ color, map, transparent, opacity } = {})
```

Per-vertex Lambertian diffuse — lit by one ambient term + one directional light. Cheaper than
`StandardMaterial`; a good default for non-metallic, non-shiny surfaces where you don't need
specular highlights. `.setMap(texture | undefined)`.

## `StandardMaterial`

```ts
new StandardMaterial({ color, map, metalness, roughness, transparent, opacity } = {})
```

Simplified PBR: GGX normal distribution + Schlick Fresnel + Smith visibility term. Lit by one
ambient term + one directional light + up to `MAX_POINT_LIGHTS` (4, exported alongside the
class) point lights. `.metalness: number` (default `0`) and `.roughness: number` (default
`0.5`) are plain public fields — set them directly, no setter method needed. `.setMap(texture
| undefined)`.

No image-based lighting in v1 (see [architecture.md](../architecture.md#known-limitations-v1))
— ambient is flat, not a convolved environment map, so you get highlights from direct lights
but not reflections of the surroundings.

## Choosing a material

| | `BasicMaterial` | `LambertMaterial` | `StandardMaterial` |
|---|---|---|---|
| Lighting | none (unlit) | ambient + 1 directional | ambient + 1 directional + up to 4 point |
| Specular highlights | no | no | yes |
| Metalness/roughness | no | no | yes |
| Relative cost | cheapest | cheap | more expensive (per-fragment GGX) |
| Good for | UI, debug geometry, pre-lit/baked textures | matte, non-shiny surfaces at scale | anything that needs to look like a real material |
