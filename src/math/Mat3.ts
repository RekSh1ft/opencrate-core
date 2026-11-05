// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Mat4 } from './Mat4.js';

/** Mutable 3x3 matrix, column-major. Primarily used as a normal matrix (inverse-transpose of Mat4's upper-left 3x3). */
export class Mat3 {
  readonly elements: Float32Array;

  constructor() {
    this.elements = new Float32Array(9);
    this.identity();
  }

  identity(): this {
    const e = this.elements;
    e[0] = 1; e[3] = 0; e[6] = 0;
    e[1] = 0; e[4] = 1; e[7] = 0;
    e[2] = 0; e[5] = 0; e[8] = 1;
    return this;
  }

  copy(m: Mat3): this {
    this.elements.set(m.elements);
    return this;
  }

  clone(): Mat3 {
    return new Mat3().copy(this);
  }

  /** Sets this to the upper-left 3x3 of `m` (no inverse/transpose applied). */
  setFromMat4(m: Mat4): this {
    const me = m.elements, e = this.elements;
    e[0] = me[0]!; e[1] = me[1]!; e[2] = me[2]!;
    e[3] = me[4]!; e[4] = me[5]!; e[5] = me[6]!;
    e[6] = me[8]!; e[7] = me[9]!; e[8] = me[10]!;
    return this;
  }

  /** Computes the normal matrix (inverse-transpose of `m`'s upper-left 3x3) — correct under non-uniform scale. */
  getNormalMatrix(m: Mat4): this {
    this.setFromMat4(m).invert().transpose();
    return this;
  }

  invert(): this {
    const e = this.elements;
    const n11 = e[0]!, n21 = e[1]!, n31 = e[2]!;
    const n12 = e[3]!, n22 = e[4]!, n32 = e[5]!;
    const n13 = e[6]!, n23 = e[7]!, n33 = e[8]!;

    const t11 = n33 * n22 - n32 * n23;
    const t12 = n32 * n13 - n33 * n12;
    const t13 = n23 * n12 - n22 * n13;

    const det = n11 * t11 + n21 * t12 + n31 * t13;
    if (det === 0) {
      throw new Error('OpenCrate Core: Mat3.invert() called on a singular matrix.');
    }
    const detInv = 1 / det;

    e[0] = t11 * detInv;
    e[1] = (n31 * n23 - n33 * n21) * detInv;
    e[2] = (n32 * n21 - n31 * n22) * detInv;
    e[3] = t12 * detInv;
    e[4] = (n33 * n11 - n31 * n13) * detInv;
    e[5] = (n31 * n12 - n32 * n11) * detInv;
    e[6] = t13 * detInv;
    e[7] = (n21 * n13 - n23 * n11) * detInv;
    e[8] = (n22 * n11 - n21 * n12) * detInv;

    return this;
  }

  transpose(): this {
    const e = this.elements;
    let t: number;
    t = e[1]!; e[1] = e[3]!; e[3] = t;
    t = e[2]!; e[2] = e[6]!; e[6] = t;
    t = e[5]!; e[5] = e[7]!; e[7] = t;
    return this;
  }

  toArray(out: number[] = [], offset = 0): number[] {
    const e = this.elements;
    for (let i = 0; i < 9; i++) out[offset + i] = e[i]!;
    return out;
  }
}
