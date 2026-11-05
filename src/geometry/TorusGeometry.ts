// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { BufferGeometry, BufferAttribute } from './BufferGeometry.js';

/** Torus in the XY plane, centered at the origin. */
export class TorusGeometry extends BufferGeometry {
  readonly params: number[];

  constructor(radius = 1, tube = 0.4, radialSegments = 16, tubularSegments = 48) {
    super();
    this.params = [radius, tube, radialSegments, tubularSegments];
    radialSegments = Math.max(3, Math.floor(radialSegments));
    tubularSegments = Math.max(3, Math.floor(tubularSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * Math.PI * 2;
        const v = (j / radialSegments) * Math.PI * 2;

        const cx = radius * Math.cos(u);
        const cz = radius * Math.sin(u);

        const x = (radius + tube * Math.cos(v)) * Math.cos(u);
        const y = tube * Math.sin(v);
        const z = (radius + tube * Math.cos(v)) * Math.sin(u);

        positions.push(x, y, z);

        const nx = x - cx, ny = y - 0, nz = z - cz;
        const len = Math.hypot(nx, ny, nz) || 1;
        normals.push(nx / len, ny / len, nz / len);

        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        const a = (tubularSegments + 1) * j + i - 1;
        const b = (tubularSegments + 1) * (j - 1) + i - 1;
        const c = (tubularSegments + 1) * (j - 1) + i;
        const d = (tubularSegments + 1) * j + i;
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
