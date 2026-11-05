// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Mat4 } from './Mat4.js';
import type { Sphere } from './Sphere.js';

/** Plane stored as (nx, ny, nz, d) with normal pointing into the half-space the frustum keeps. */
type Plane = [number, number, number, number];

/** View frustum derived from a view-projection matrix, used for bounding-sphere culling. */
export class Frustum {
  readonly planes: [Plane, Plane, Plane, Plane, Plane, Plane] = [
    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
  ];

  setFromViewProjectionMatrix(m: Mat4): this {
    const e = m.elements;
    const m0 = e[0]!, m1 = e[1]!, m2 = e[2]!, m3 = e[3]!;
    const m4 = e[4]!, m5 = e[5]!, m6 = e[6]!, m7 = e[7]!;
    const m8 = e[8]!, m9 = e[9]!, m10 = e[10]!, m11 = e[11]!;
    const m12 = e[12]!, m13 = e[13]!, m14 = e[14]!, m15 = e[15]!;

    this.setPlane(0, m3 + m0, m7 + m4, m11 + m8, m15 + m12); // left
    this.setPlane(1, m3 - m0, m7 - m4, m11 - m8, m15 - m12); // right
    this.setPlane(2, m3 + m1, m7 + m5, m11 + m9, m15 + m13); // bottom
    this.setPlane(3, m3 - m1, m7 - m5, m11 - m9, m15 - m13); // top
    this.setPlane(4, m3 + m2, m7 + m6, m11 + m10, m15 + m14); // near
    this.setPlane(5, m3 - m2, m7 - m6, m11 - m10, m15 - m14); // far
    return this;
  }

  private setPlane(i: number, a: number, b: number, c: number, d: number): void {
    const len = Math.sqrt(a * a + b * b + c * c) || 1;
    const p = this.planes[i]!;
    p[0] = a / len; p[1] = b / len; p[2] = c / len; p[3] = d / len;
  }

  intersectsSphere(sphere: Sphere): boolean {
    const { center, radius } = sphere;
    for (let i = 0; i < 6; i++) {
      const p = this.planes[i]!;
      const dist = p[0] * center.x + p[1] * center.y + p[2] * center.z + p[3];
      if (dist < -radius) return false;
    }
    return true;
  }
}
