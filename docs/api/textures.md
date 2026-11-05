# `textures`

## `Texture`

```ts
new Texture(image: TextureImageSource | null = null)
// TextureImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas
```

CPU-side description of a 2D texture. The device lazily creates and caches the GPU texture,
re-uploading only when `.version` changes.

| Property | Default | Notes |
|---|---|---|
| `.image` | the constructor arg | |
| `.wrapS` / `.wrapT` | `'repeat'` | `'repeat' \| 'clamp-to-edge' \| 'mirrored-repeat'` |
| `.minFilter` / `.magFilter` | `'linear'` | `'nearest' \| 'linear'` |
| `.generateMipmapsOnUpload` | `true` | |
| `.anisotropy` | `1` | |
| `.flipY` | `true` | |
| `.colorSpace` | `'srgb'` | `'srgb' \| 'linear'` — set `'linear'` for normal/roughness/metalness maps |
| `.version` | bumped on load | |

`.setImage(image)` / `.needsUpdate()` (call after mutating an already-assigned canvas source
in place) / `.generateMipmaps()` / `.dispose()`.

## `DataTexture`

```ts
new DataTexture(data: Uint8ClampedArray, width: number, height: number)
// extends Texture — data.length must equal width * height * 4 (RGBA)
```

Raw-pixel texture for procedural noise, solid colors, LUTs — no image decode needed. Defaults
to `minFilter`/`magFilter: 'nearest'`, `generateMipmapsOnUpload: false`, `flipY: false`.

```ts
DataTexture.solid(255, 128, 0, 255); // 1x1 solid-color convenience factory
```

Non-power-of-two `DataTexture`s fall back to non-mipmapped filtering — see
[architecture.md](../architecture.md#known-limitations-v1).

## `CubeTexture`

```ts
new CubeTexture(faces: CubeFaces | null = null)
// CubeFaces = a 6-tuple of TextureImageSource, order matching
//   TEXTURE_CUBE_MAP_POSITIVE_X, NEGATIVE_X, POSITIVE_Y, NEGATIVE_Y, POSITIVE_Z, NEGATIVE_Z
```

Six-face cubemap, for skyboxes/environment reflections. Defaults `wrapS`/`wrapT` to
`'clamp-to-edge'`. `.setFaces(faces)`.
