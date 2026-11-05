// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

export type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';

/** Mutable Euler angle triple (radians) with an explicit rotation order. */
export class Euler {
  x: number;
  y: number;
  z: number;
  order: EulerOrder;

  static readonly DEFAULT_ORDER: EulerOrder = 'XYZ';

  constructor(x = 0, y = 0, z = 0, order: EulerOrder = Euler.DEFAULT_ORDER) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }

  set(x: number, y: number, z: number, order: EulerOrder = this.order): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
    return this;
  }

  copy(e: Euler): this {
    this.x = e.x;
    this.y = e.y;
    this.z = e.z;
    this.order = e.order;
    return this;
  }

  clone(): Euler {
    return new Euler(this.x, this.y, this.z, this.order);
  }

  equals(e: Euler, eps = 1e-6): boolean {
    return (
      Math.abs(this.x - e.x) < eps &&
      Math.abs(this.y - e.y) < eps &&
      Math.abs(this.z - e.z) < eps &&
      this.order === e.order
    );
  }
}
