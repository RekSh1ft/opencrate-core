// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { BufferGeometry, BufferAttribute } from './BufferGeometry.js';

/** Flat grid in the XY plane (normal +Z), centered at the origin. */
export class PlaneGeometry extends BufferGeometry {
  readonly params: number[];

  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    this.params = [width, height, widthSegments, heightSegments];

    widthSegments = Math.max(1, Math.floor(widthSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const hw = width / 2, hh = height / 2;
    const gridX1 = widthSegments + 1, gridY1 = heightSegments + 1;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let iy = 0; iy < gridY1; iy++) {
      const y = (iy / heightSegments) * height - hh;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = (ix / widthSegments) * width - hw;
        positions.push(x, -y, 0);
        normals.push(0, 0, 1);
        uvs.push(ix / widthSegments, 1 - iy / heightSegments);
      }
    }

    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = ix + 1 + gridX1 * (iy + 1);
        const d = ix + 1 + gridX1 * iy;
        indices.push(a, b, d, b, c, d);
      }
    }

    this.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    this.setIndex(indices);
    this.computeBoundingSphere();
  }
}
