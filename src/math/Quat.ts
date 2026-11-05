// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Mat4 } from './Mat4.js';
import type { Euler } from './Euler.js';

/** Mutable quaternion (x, y, z, w). All instance methods mutate `this` and return `this`. */
export class Quat {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copy(q: Quat): this {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  clone(): Quat {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  identity(): this {
    return this.set(0, 0, 0, 1);
  }

  /** Standard intrinsic Tait-Bryan rotation, order taken from `e.order` (default XYZ). */
  fromEuler(e: Euler): this {
    const x = e.x, y = e.y, z = e.z;
    const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);

    switch (e.order) {
      case 'XYZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'ZXY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'ZYX':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'YZX':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'XZY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      default:
        throw new Error(`OpenCrate Core: Quat.fromEuler() unsupported order "${String(e.order)}".`);
    }
    return this;
  }

  /** Extracts a rotation quaternion from the upper-left 3x3 of a (non-skewed, possibly scaled) matrix. */
  fromMat4(m: Mat4): this {
    const e = m.elements;
    const m11 = e[0]!, m12 = e[4]!, m13 = e[8]!;
    const m21 = e[1]!, m22 = e[5]!, m23 = e[9]!;
    const m31 = e[2]!, m32 = e[6]!, m33 = e[10]!;
    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      this.w = 0.25 / s;
      this.x = (m32 - m23) * s;
      this.y = (m13 - m31) * s;
      this.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
      this.w = (m32 - m23) / s;
      this.x = 0.25 * s;
      this.y = (m12 + m21) / s;
      this.z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      this.w = (m13 - m31) / s;
      this.x = (m12 + m21) / s;
      this.y = 0.25 * s;
      this.z = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
      this.w = (m21 - m12) / s;
      this.x = (m13 + m31) / s;
      this.y = (m23 + m32) / s;
      this.z = 0.25 * s;
    }
    return this;
  }

  setFromAxisAngle(axisX: number, axisY: number, axisZ: number, angle: number): this {
    const half = angle / 2;
    const s = Math.sin(half);
    this.x = axisX * s;
    this.y = axisY * s;
    this.z = axisZ * s;
    this.w = Math.cos(half);
    return this;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  normalize(): this {
    let len = this.length();
    if (len === 0) {
      this.x = 0; this.y = 0; this.z = 0; this.w = 1;
    } else {
      len = 1 / len;
      this.x *= len; this.y *= len; this.z *= len; this.w *= len;
    }
    return this;
  }

  conjugate(): this {
    this.x *= -1; this.y *= -1; this.z *= -1;
    return this;
  }

  invert(): this {
    return this.conjugate().normalize();
  }

  dot(q: Quat): number {
    return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
  }

  multiply(q: Quat): this {
    return this.multiplyQuats(this, q);
  }

  premultiply(q: Quat): this {
    return this.multiplyQuats(q, this);
  }

  multiplyQuats(a: Quat, b: Quat): this {
    const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
    return this;
  }

  /** Spherical linear interpolation toward `q` by `t` in [0, 1]. */
  slerp(q: Quat, t: number): this {
    if (t === 0) return this;
    if (t === 1) return this.copy(q);

    const { x, y, z, w } = this;
    let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

    let qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    if (cosHalfTheta < 0) {
      qw = -qw; qx = -qx; qy = -qy; qz = -qz;
      cosHalfTheta = -cosHalfTheta;
    }

    if (cosHalfTheta >= 1.0) {
      this.w = w; this.x = x; this.y = y; this.z = z;
      return this;
    }

    const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;
    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - t;
      this.w = s * w + t * qw;
      this.x = s * x + t * qx;
      this.y = s * y + t * qy;
      this.z = s * z + t * qz;
      return this.normalize();
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    this.w = w * ratioA + qw * ratioB;
    this.x = x * ratioA + qx * ratioB;
    this.y = y * ratioA + qy * ratioB;
    this.z = z * ratioA + qz * ratioB;
    return this;
  }

  static slerpQuats(a: Quat, b: Quat, t: number, out: Quat): Quat {
    return out.copy(a).slerp(b, t);
  }

  equals(q: Quat, eps = 1e-6): boolean {
    return (
      Math.abs(this.x - q.x) < eps &&
      Math.abs(this.y - q.y) < eps &&
      Math.abs(this.z - q.z) < eps &&
      Math.abs(this.w - q.w) < eps
    );
  }
}
