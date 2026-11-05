// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import type { BufferGeometry } from '../geometry/BufferGeometry.js';
import type { Material } from '../material/Material.js';

/** Renderable point cloud (WebGL POINTS) — geometry + material pair. */
export class Points extends Object3D {
  geometry: BufferGeometry;
  material: Material;
  size = 1;

  constructor(geometry: BufferGeometry, material: Material) {
    super();
    this.name = 'Points';
    this.geometry = geometry;
    this.material = material;
  }

  override clone(recursive = true): Points {
    const copy = new Points(this.geometry, this.material);
    copy.copy(this, recursive);
    copy.size = this.size;
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
