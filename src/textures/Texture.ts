// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

export type WrapMode = 'repeat' | 'clamp-to-edge' | 'mirrored-repeat';
export type FilterMode = 'nearest' | 'linear';

export type TextureImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

let nextTextureId = 1;

/**
 * CPU-side description of a 2D texture. The Device lazily creates and caches the GPU
 * texture object, re-uploading only when `version` changes.
 */
export class Texture {
  readonly id = nextTextureId++;
  name = '';

  image: TextureImageSource | null = null;

  wrapS: WrapMode = 'repeat';
  wrapT: WrapMode = 'repeat';
  minFilter: FilterMode = 'linear';
  magFilter: FilterMode = 'linear';
  generateMipmapsOnUpload = true;
  anisotropy = 1;
  flipY = true;
  /** sRGB-encoded source data (color maps) vs linear (normal/roughness/metalness maps). */
  colorSpace: 'srgb' | 'linear' = 'srgb';

  /** Bumped whenever the texture needs re-upload (new image, or `needsUpdate()` called after mutation). */
  version = 0;

  /** Opaque per-device GPU handle cache; populated by WebGLDevice. */
  readonly _gpu = new Map<unknown, unknown>();

  constructor(image: TextureImageSource | null = null) {
    this.image = image;
    if (image) this.version++;
  }

  setImage(image: TextureImageSource): this {
    this.image = image;
    this.needsUpdate();
    return this;
  }

  needsUpdate(): void {
    this.version++;
  }

  generateMipmaps(): this {
    this.generateMipmapsOnUpload = true;
    this.needsUpdate();
    return this;
  }

  dispose(): void {
    this._gpu.clear();
  }
}
