// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Vec3 } from './Vec3.js';
import type { Quat } from './Quat.js';

/**
 * Mutable 4x4 matrix stored column-major in a flat Float32Array, matching
 * WebGL's native layout (elements[0..3] = column 0, etc). All instance
 * methods mutate `this` and return `this`.
 */
export class Mat4 {
  readonly elements: Float32Array;

  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }

  identity(): this {
    const e = this.elements;
    e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
    e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
    e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    return this;
  }

  set(
    n11: number, n12: number, n13: number, n14: number,
    n21: number, n22: number, n23: number, n24: number,
    n31: number, n32: number, n33: number, n34: number,
    n41: number, n42: number, n43: number, n44: number,
  ): this {
    const e = this.elements;
    e[0] = n11; e[4] = n12; e[8] = n13; e[12] = n14;
    e[1] = n21; e[5] = n22; e[9] = n23; e[13] = n24;
    e[2] = n31; e[6] = n32; e[10] = n33; e[14] = n34;
    e[3] = n41; e[7] = n42; e[11] = n43; e[15] = n44;
    return this;
  }

  copy(m: Mat4): this {
    this.elements.set(m.elements);
    return this;
  }

  clone(): Mat4 {
    return new Mat4().copy(this);
  }

  multiply(m: Mat4): this {
    return this.multiplyMatrices(this, m);
  }

  premultiply(m: Mat4): this {
    return this.multiplyMatrices(m, this);
  }

  multiplyMatrices(a: Mat4, b: Mat4): this {
    const ae = a.elements, be = b.elements;
    const te = Mat4._tmp.elements;

    const a11 = ae[0]!, a12 = ae[4]!, a13 = ae[8]!, a14 = ae[12]!;
    const a21 = ae[1]!, a22 = ae[5]!, a23 = ae[9]!, a24 = ae[13]!;
    const a31 = ae[2]!, a32 = ae[6]!, a33 = ae[10]!, a34 = ae[14]!;
    const a41 = ae[3]!, a42 = ae[7]!, a43 = ae[11]!, a44 = ae[15]!;

    const b11 = be[0]!, b12 = be[4]!, b13 = be[8]!, b14 = be[12]!;
    const b21 = be[1]!, b22 = be[5]!, b23 = be[9]!, b24 = be[13]!;
    const b31 = be[2]!, b32 = be[6]!, b33 = be[10]!, b34 = be[14]!;
    const b41 = be[3]!, b42 = be[7]!, b43 = be[11]!, b44 = be[15]!;

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    this.elements.set(te);
    return this;
  }

  determinant(): number {
    const e = this.elements;
    const n11 = e[0]!, n12 = e[4]!, n13 = e[8]!, n14 = e[12]!;
    const n21 = e[1]!, n22 = e[5]!, n23 = e[9]!, n24 = e[13]!;
    const n31 = e[2]!, n32 = e[6]!, n33 = e[10]!, n34 = e[14]!;
    const n41 = e[3]!, n42 = e[7]!, n43 = e[11]!, n44 = e[15]!;

    return (
      n41 * (
        n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 +
        n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34
      ) +
      n42 * (
        n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 -
        n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31
      ) +
      n43 * (
        n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 +
        n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31
      ) +
      n44 * (
        -n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 +
        n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31
      )
    );
  }

  /** Inverts in place. Throws if the matrix is singular (programmer error: degenerate transform). */
  invert(): this {
    const e = this.elements;
    const n11 = e[0]!, n21 = e[1]!, n31 = e[2]!, n41 = e[3]!;
    const n12 = e[4]!, n22 = e[5]!, n32 = e[6]!, n42 = e[7]!;
    const n13 = e[8]!, n23 = e[9]!, n33 = e[10]!, n43 = e[11]!;
    const n14 = e[12]!, n24 = e[13]!, n34 = e[14]!, n44 = e[15]!;

    const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) {
      throw new Error('OpenCrate Core: Mat4.invert() called on a singular (non-invertible) matrix.');
    }

    const detInv = 1 / det;
    const te = this.elements;

    te[0] = t11 * detInv;
    te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
    te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
    te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

    te[4] = t12 * detInv;
    te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
    te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
    te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

    te[8] = t13 * detInv;
    te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
    te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
    te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

    te[12] = t14 * detInv;
    te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
    te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
    te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

    return this;
  }

  transpose(): this {
    const e = this.elements;
    let t: number;
    t = e[1]!; e[1] = e[4]!; e[4] = t;
    t = e[2]!; e[2] = e[8]!; e[8] = t;
    t = e[6]!; e[6] = e[9]!; e[9] = t;
    t = e[3]!; e[3] = e[12]!; e[12] = t;
    t = e[7]!; e[7] = e[13]!; e[13] = t;
    t = e[11]!; e[11] = e[14]!; e[14] = t;
    return this;
  }

  makeTranslation(x: number, y: number, z: number): this {
    return this.set(
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1,
    );
  }

  makeScale(x: number, y: number, z: number): this {
    return this.set(
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    );
  }

  makeRotationFromQuat(q: Quat): this {
    return this.compose(Mat4._zeroPos, q, Mat4._onePos);
  }

  /** Composes position * rotation * scale into this matrix (TRS order, no allocation). */
  compose(position: Vec3, quat: Quat, scale: Vec3): this {
    const te = this.elements;

    const x = quat.x, y = quat.y, z = quat.z, w = quat.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    const sx = scale.x, sy = scale.y, sz = scale.z;

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;

    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;

    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;

    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;

    return this;
  }

  /** Decomposes this matrix into position/quaternion/scale. Mutates the three output arguments. */
  decompose(position: Vec3, quat: Quat, scale: Vec3): this {
    const e = this.elements;

    let sx = Mat4._tmpV1.set(e[0]!, e[1]!, e[2]!).length();
    const sy = Mat4._tmpV1.set(e[4]!, e[5]!, e[6]!).length();
    const sz = Mat4._tmpV1.set(e[8]!, e[9]!, e[10]!).length();

    const det = this.determinant();
    if (det < 0) sx = -sx;

    position.x = e[12]!;
    position.y = e[13]!;
    position.z = e[14]!;

    const invSX = 1 / sx, invSY = 1 / sy, invSZ = 1 / sz;

    const rm = Mat4._tmpRot;
    rm.elements.set(this.elements);
    const re = rm.elements;

    re[0]! *= invSX; re[1]! *= invSX; re[2]! *= invSX;
    re[4]! *= invSY; re[5]! *= invSY; re[6]! *= invSY;
    re[8]! *= invSZ; re[9]! *= invSZ; re[10]! *= invSZ;

    quat.fromMat4(rm);

    scale.x = sx;
    scale.y = sy;
    scale.z = sz;

    return this;
  }

  /** Right-handed perspective projection matching WebGL's [-1, 1] clip-space Z convention. */
  makePerspective(fovYRad: number, aspect: number, near: number, far: number): this {
    const f = 1 / Math.tan(fovYRad / 2);
    const te = this.elements;
    te[0] = f / aspect; te[4] = 0; te[8] = 0; te[12] = 0;
    te[1] = 0; te[5] = f; te[9] = 0; te[13] = 0;
    te[2] = 0; te[6] = 0; te[11] = -1;
    te[3] = 0; te[7] = 0; te[15] = 0;

    if (far !== Infinity) {
      const nf = 1 / (near - far);
      te[10] = (far + near) * nf;
      te[14] = 2 * far * near * nf;
    } else {
      te[10] = -1;
      te[14] = -2 * near;
    }
    return this;
  }

  makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): this {
    const w = 1 / (right - left);
    const h = 1 / (top - bottom);
    const p = 1 / (far - near);
    const x = (right + left) * w;
    const y = (top + bottom) * h;
    const z = (far + near) * p;

    return this.set(
      2 * w, 0, 0, -x,
      0, 2 * h, 0, -y,
      0, 0, -2 * p, -z,
      0, 0, 0, 1,
    );
  }

  lookAt(eye: Vec3, target: Vec3, up: Vec3): this {
    const z = Mat4._lookZ.subVectors(eye, target);
    if (z.lengthSq() === 0) z.z = 1;
    z.normalize();

    let x = Mat4._lookX.crossVectors(up, z);
    if (x.lengthSq() === 0) {
      if (Math.abs(up.z) === 1) z.x += 1e-4; else z.z += 1e-4;
      z.normalize();
      x = Mat4._lookX.crossVectors(up, z);
    }
    x.normalize();

    const y = Mat4._lookY.crossVectors(z, x);

    const te = this.elements;
    te[0] = x.x; te[4] = y.x; te[8] = z.x;
    te[1] = x.y; te[5] = y.y; te[9] = z.y;
    te[2] = x.z; te[6] = y.z; te[10] = z.z;
    return this;
  }

  extractPosition(out: Vec3): Vec3 {
    const e = this.elements;
    return out.set(e[12]!, e[13]!, e[14]!);
  }

  toArray(out: number[] = [], offset = 0): number[] {
    const e = this.elements;
    for (let i = 0; i < 16; i++) out[offset + i] = e[i]!;
    return out;
  }

  equals(m: Mat4, eps = 1e-6): boolean {
    const a = this.elements, b = m.elements;
    for (let i = 0; i < 16; i++) {
      if (Math.abs(a[i]! - b[i]!) > eps) return false;
    }
    return true;
  }

  private static readonly _tmp = new Mat4();
  private static readonly _tmpRot = new Mat4();
  private static readonly _tmpV1 = new Vec3();
  private static readonly _zeroPos = new Vec3(0, 0, 0);
  private static readonly _onePos = new Vec3(1, 1, 1);
  private static readonly _lookX = new Vec3();
  private static readonly _lookY = new Vec3();
  private static readonly _lookZ = new Vec3();
}
