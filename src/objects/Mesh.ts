// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import type { BufferGeometry } from '../geometry/BufferGeometry.js';
import type { Material } from '../material/Material.js';

/**
 * Renderable triangle mesh: a geometry + material pair. Geometry and material are
 * referenced (shared), not copied — call `.clone()` explicitly if you need a new
 * material instance (e.g. to vary opacity per-instance without affecting siblings).
 */
export class Mesh extends Object3D {
  geometry: BufferGeometry;
  material: Material;
  drawMode: 'triangles' | 'lines' | 'points' = 'triangles';

  constructor(geometry: BufferGeometry, material: Material) {
    super();
    this.name = 'Mesh';
    this.geometry = geometry;
    this.material = material;
  }

  override clone(recursive = true): Mesh {
    const copy = new Mesh(this.geometry, this.material);
    copy.copy(this, recursive);
    copy.drawMode = this.drawMode;
    return copy;
  }

  /** Releases this mesh's own geometry/material GPU resources. Does NOT dispose shared
   *  resources referenced by sibling meshes unless `includeShared` is explicitly set — the
   *  caller owns that decision since geometries/materials may be intentionally shared. */
  override dispose(includeShared = true): void {
    if (includeShared) {
      this.geometry.dispose();
      this.material.dispose();
    }
    super.dispose();
  }
}
