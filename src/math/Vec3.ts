// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Mat4 } from './Mat4.js';
import type { Quat } from './Quat.js';

/**
 * Mutable 3-component vector. All instance methods mutate `this` and return
 * `this` for chaining, matching the engine-wide convention. Use `.clone()`
 * when a fresh copy is required.
 */
export class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  setScalar(s: number): this {
    this.x = s;
    this.y = s;
    this.z = s;
    return this;
  }

  copy(v: Vec3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v: Vec3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addScalar(s: number): this {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
  }

  addVectors(a: Vec3, b: Vec3): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  addScaledVector(v: Vec3, s: number): this {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }

  sub(v: Vec3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  subVectors(a: Vec3, b: Vec3): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  multiply(v: Vec3): this {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  divideScalar(s: number): this {
    return this.scale(1 / s);
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): this {
    return this.crossVectors(this, v);
  }

  crossVectors(a: Vec3, b: Vec3): this {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  normalize(): this {
    const len = this.length();
    return len > 0 ? this.scale(1 / len) : this;
  }

  setLength(len: number): this {
    return this.normalize().scale(len);
  }

  lerp(v: Vec3, t: number): this {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    this.z += (v.z - this.z) * t;
    return this;
  }

  lerpVectors(a: Vec3, b: Vec3, t: number): this {
    this.x = a.x + (b.x - a.x) * t;
    this.y = a.y + (b.y - a.y) * t;
    this.z = a.z + (b.z - a.z) * t;
    return this;
  }

  distanceTo(v: Vec3): number {
    return Math.sqrt(this.distanceToSquared(v));
  }

  distanceToSquared(v: Vec3): number {
    const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  min(v: Vec3): this {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);
    this.z = Math.min(this.z, v.z);
    return this;
  }

  max(v: Vec3): this {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);
    this.z = Math.max(this.z, v.z);
    return this;
  }

  applyMat4(m: Mat4): this {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    const w = e[3]! * x + e[7]! * y + e[11]! * z + e[15]!;
    const invW = w !== 0 ? 1 / w : 1;
    this.x = (e[0]! * x + e[4]! * y + e[8]! * z + e[12]!) * invW;
    this.y = (e[1]! * x + e[5]! * y + e[9]! * z + e[13]!) * invW;
    this.z = (e[2]! * x + e[6]! * y + e[10]! * z + e[14]!) * invW;
    return this;
  }

  /** Applies only the upper-left 3x3 of `m` — for directions/normals (use a normal matrix for non-uniform scale). */
  transformDirection(m: Mat4): this {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    this.x = e[0]! * x + e[4]! * y + e[8]! * z;
    this.y = e[1]! * x + e[5]! * y + e[9]! * z;
    this.z = e[2]! * x + e[6]! * y + e[10]! * z;
    return this.normalize();
  }

  applyQuat(q: Quat): this {
    const x = this.x, y = this.y, z = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
  }

  equals(v: Vec3, eps = 1e-6): boolean {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps && Math.abs(this.z - v.z) < eps;
  }

  toArray(out: number[] = [], offset = 0): number[] {
    out[offset] = this.x;
    out[offset + 1] = this.y;
    out[offset + 2] = this.z;
    return out;
  }

  fromArray(arr: ArrayLike<number>, offset = 0): this {
    this.x = arr[offset]!;
    this.y = arr[offset + 1]!;
    this.z = arr[offset + 2]!;
    return this;
  }

  static readonly ZERO: Readonly<Vec3> = new Vec3(0, 0, 0);
  static readonly ONE: Readonly<Vec3> = new Vec3(1, 1, 1);
  static readonly UP: Readonly<Vec3> = new Vec3(0, 1, 0);
  static readonly FORWARD: Readonly<Vec3> = new Vec3(0, 0, -1);

  /** Shared scratch instances for allocation-free internal math. Never store a reference to these. */
  static readonly _tmp1 = new Vec3();
  static readonly _tmp2 = new Vec3();
  static readonly _tmp3 = new Vec3();
}
