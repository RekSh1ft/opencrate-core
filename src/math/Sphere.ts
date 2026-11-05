// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Vec3 } from './Vec3.js';

/** Mutable bounding sphere used for frustum culling. */
export class Sphere {
  readonly center: Vec3;
  radius: number;

  constructor(center = new Vec3(), radius = -1) {
    this.center = center;
    this.radius = radius;
  }

  set(center: Vec3, radius: number): this {
    this.center.copy(center);
    this.radius = radius;
    return this;
  }

  /** Welzl-free, O(n) approximate bounding sphere: centroid + max extent. Good enough for culling. */
  setFromPoints(points: ArrayLike<number>): this {
    const c = this.center.set(0, 0, 0);
    const count = points.length / 3;
    if (count === 0) {
      this.radius = 0;
      return this;
    }
    for (let i = 0; i < count; i++) {
      c.x += points[i * 3]!;
      c.y += points[i * 3 + 1]!;
      c.z += points[i * 3 + 2]!;
    }
    c.scale(1 / count);

    let maxSq = 0;
    for (let i = 0; i < count; i++) {
      const dx = points[i * 3]! - c.x;
      const dy = points[i * 3 + 1]! - c.y;
      const dz = points[i * 3 + 2]! - c.z;
      const sq = dx * dx + dy * dy + dz * dz;
      if (sq > maxSq) maxSq = sq;
    }
    this.radius = Math.sqrt(maxSq);
    return this;
  }

  copy(s: Sphere): this {
    this.center.copy(s.center);
    this.radius = s.radius;
    return this;
  }

  clone(): Sphere {
    return new Sphere(this.center.clone(), this.radius);
  }

  isEmpty(): boolean {
    return this.radius < 0;
  }
}
