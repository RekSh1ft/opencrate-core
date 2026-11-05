// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { BufferGeometry, BufferAttribute } from './BufferGeometry.js';

/** Axis-aligned box centered at the origin, with correct per-face normals and UVs. */
export class BoxGeometry extends BufferGeometry {
  /** Constructor params, stashed for ObjectLoader round-tripping. */
  readonly params: number[];

  constructor(width = 1, height = 1, depth = 1) {
    super();
    this.params = [width, height, depth];

    const hw = width / 2, hh = height / 2, hd = depth / 2;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Each face: normal axis, the two tangent axes used to sweep the quad's corners, and
    // the half-extents along (normal, tangentU, tangentV).
    type Face = {
      normal: [number, number, number];
      uAxis: [number, number, number];
      vAxis: [number, number, number];
      halfU: number;
      halfV: number;
      offset: number; // distance along normal
    };

    const faces: Face[] = [
      { normal: [0, 0, 1], uAxis: [1, 0, 0], vAxis: [0, 1, 0], halfU: hw, halfV: hh, offset: hd },  // +Z
      { normal: [0, 0, -1], uAxis: [-1, 0, 0], vAxis: [0, 1, 0], halfU: hw, halfV: hh, offset: hd }, // -Z
      { normal: [0, 1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, -1], halfU: hw, halfV: hd, offset: hh },  // +Y
      { normal: [0, -1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, 1], halfU: hw, halfV: hd, offset: hh },  // -Y
      { normal: [1, 0, 0], uAxis: [0, 0, -1], vAxis: [0, 1, 0], halfU: hd, halfV: hh, offset: hw },  // +X
      { normal: [-1, 0, 0], uAxis: [0, 0, 1], vAxis: [0, 1, 0], halfU: hd, halfV: hh, offset: hw },  // -X
    ];

    let vertIdx = 0;
    for (const f of faces) {
      const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [su, sv] of corners) {
        const x = f.normal[0] * f.offset + f.uAxis[0] * su * f.halfU + f.vAxis[0] * sv * f.halfV;
        const y = f.normal[1] * f.offset + f.uAxis[1] * su * f.halfU + f.vAxis[1] * sv * f.halfV;
        const z = f.normal[2] * f.offset + f.uAxis[2] * su * f.halfU + f.vAxis[2] * sv * f.halfV;
        positions.push(x, y, z);
        normals.push(f.normal[0], f.normal[1], f.normal[2]);
        uvs.push((su + 1) / 2, (sv + 1) / 2);
      }
      indices.push(vertIdx, vertIdx + 1, vertIdx + 2, vertIdx, vertIdx + 2, vertIdx + 3);
      vertIdx += 4;
    }

    this.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    this.setIndex(indices);
    this.computeBoundingSphere();
  }
}
