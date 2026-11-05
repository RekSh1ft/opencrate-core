// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { BufferGeometry, BufferAttribute } from './BufferGeometry.js';

/** Cylinder (optionally a cone, via radiusTop=0) centered at the origin, axis along +Y, with end caps. */
export class CylinderGeometry extends BufferGeometry {
  readonly params: number[];

  constructor(
    radiusTop = 1,
    radiusBottom = 1,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
  ) {
    super();
    this.params = [radiusTop, radiusBottom, height, radialSegments, heightSegments];
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfHeight = height / 2;
    const slope = (radiusBottom - radiusTop) / height;

    let index = 0;
    const indexGrid: number[][] = [];

    for (let y = 0; y <= heightSegments; y++) {
      const row: number[] = [];
      const v = y / heightSegments;
      const radius = v * (radiusBottom - radiusTop) + radiusTop;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;
        const sinT = Math.sin(theta), cosT = Math.cos(theta);

        positions.push(radius * sinT, -v * height + halfHeight, radius * cosT);
        const len = Math.hypot(sinT, slope, cosT) || 1;
        normals.push(sinT / len, slope / len, cosT / len);
        uvs.push(u, 1 - v);
        row.push(index++);
      }
      indexGrid.push(row);
    }

    for (let x = 0; x < radialSegments; x++) {
      for (let y = 0; y < heightSegments; y++) {
        const a = indexGrid[y]![x]!;
        const b = indexGrid[y + 1]![x]!;
        const c = indexGrid[y + 1]![x + 1]!;
        const d = indexGrid[y]![x + 1]!;
        indices.push(a, b, d, b, c, d);
      }
    }

    if (!openEnded) {
      if (radiusTop > 0) addCap(true);
      if (radiusBottom > 0) addCap(false);
    }

    function addCap(top: boolean): void {
      const radius = top ? radiusTop : radiusBottom;
      const sign = top ? 1 : -1;
      const centerIndex = index++;
      positions.push(0, sign * halfHeight, 0);
      normals.push(0, sign, 0);
      uvs.push(0.5, 0.5);

      const start = index;
      for (let x = 0; x <= radialSegments; x++) {
        const theta = (x / radialSegments) * Math.PI * 2;
        const sinT = Math.sin(theta), cosT = Math.cos(theta);
        positions.push(radius * sinT, sign * halfHeight, radius * cosT);
        normals.push(0, sign, 0);
        uvs.push(sinT * 0.5 + 0.5, cosT * 0.5 + 0.5);
        index++;
      }
      for (let x = 0; x < radialSegments; x++) {
        if (top) indices.push(centerIndex, start + x, start + x + 1);
        else indices.push(centerIndex, start + x + 1, start + x);
      }
    }

    this.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    this.setIndex(indices);
    this.computeBoundingSphere();
  }
}
