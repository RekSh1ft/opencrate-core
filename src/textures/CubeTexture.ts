// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Texture, type TextureImageSource } from './Texture.js';

/** Order matches WebGL's TEXTURE_CUBE_MAP_POSITIVE_X.. enum sequence. */
export type CubeFaces = [
  TextureImageSource, TextureImageSource, TextureImageSource,
  TextureImageSource, TextureImageSource, TextureImageSource,
];

/** Six-face cubemap texture, used for skyboxes / environment reflections. */
export class CubeTexture extends Texture {
  faces: CubeFaces | null;

  constructor(faces: CubeFaces | null = null) {
    super(null);
    this.faces = faces;
    this.wrapS = 'clamp-to-edge';
    this.wrapT = 'clamp-to-edge';
    if (faces) this.version++;
  }

  setFaces(faces: CubeFaces): this {
    this.faces = faces;
    this.needsUpdate();
    return this;
  }
}
