// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { BufferGeometry, BufferAttribute } from './BufferGeometry.js';

/** UV sphere centered at the origin. */
export class SphereGeometry extends BufferGeometry {
  readonly params: number[];

  constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
    super();
    this.params = [radius, widthSegments, heightSegments];

    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const grid: number[][] = [];

    for (let iy = 0; iy <= heightSegments; iy++) {
      const row: number[] = [];
      const v = iy / heightSegments;
      const theta = v * Math.PI;
      const sinT = Math.sin(theta), cosT = Math.cos(theta);

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        const phi = u * Math.PI * 2;
        const sinP = Math.sin(phi), cosP = Math.cos(phi);

        const x = -radius * sinT * cosP;
        const y = radius * cosT;
        const z = radius * sinT * sinP;

        positions.push(x, y, z);
        const len = Math.hypot(x, y, z) || 1;
        normals.push(x / len, y / len, z / len);
        uvs.push(u, 1 - v);

        row.push(positions.length / 3 - 1);
      }
      grid.push(row);
    }

    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy]![ix + 1]!;
        const b = grid[iy]![ix]!;
        const c = grid[iy + 1]![ix]!;
        const d = grid[iy + 1]![ix + 1]!;

        if (iy !== 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1) indices.push(b, c, d);
      }
    }

    this.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    this.setIndex(indices);
    this.computeBoundingSphere();
  }
}
