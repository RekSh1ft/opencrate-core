// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import type { BufferGeometry } from '../geometry/BufferGeometry.js';
import type { Material } from '../material/Material.js';

/** Renderable connected line strip (WebGL LINE_STRIP) — geometry + material pair. */
export class Line extends Object3D {
  geometry: BufferGeometry;
  material: Material;

  constructor(geometry: BufferGeometry, material: Material) {
    super();
    this.name = 'Line';
    this.geometry = geometry;
    this.material = material;
  }

  override clone(recursive = true): Line {
    const copy = new Line(this.geometry, this.material);
    copy.copy(this, recursive);
    return copy;
  }

  override dispose(includeShared = true): void {
    if (includeShared) {
      this.geometry.dispose();
      this.material.dispose();
    }
    super.dispose();
  }
}
