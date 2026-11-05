// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Texture } from '../textures/Texture.js';

/** Loads an HTMLImageElement from a URL and wraps it in a Texture. Promise-based, with an error path. */
export class TextureLoader {
  crossOrigin = 'anonymous';

  load(url: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = this.crossOrigin;
      image.onload = () => resolve(new Texture(image));
      image.onerror = () => reject(new Error(`OpenCrate Core: TextureLoader failed to load "${url}".`));
      image.src = url;
    });
  }

  async loadAll(urls: string[]): Promise<Texture[]> {
    return Promise.all(urls.map((url) => this.load(url)));
  }
}
