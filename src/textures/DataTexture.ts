// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Texture } from './Texture.js';

/** Texture backed by a raw RGBA Uint8ClampedArray — for procedural noise, solid colors, LUTs, etc. */
export class DataTexture extends Texture {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    super(null);
    if (data.length !== width * height * 4) {
      throw new Error(
        `OpenCrate Core: DataTexture data length (${data.length}) must equal width*height*4 (${width * height * 4}).`,
      );
    }
    this.data = data;
    this.width = width;
    this.height = height;
    this.minFilter = 'nearest';
    this.magFilter = 'nearest';
    this.generateMipmapsOnUpload = false;
    this.flipY = false;
    this.version = 1;
  }

  /** Convenience factory: a 1x1 solid-color texture. */
  static solid(r: number, g: number, b: number, a = 255): DataTexture {
    return new DataTexture(new Uint8ClampedArray([r, g, b, a]), 1, 1);
  }
}
