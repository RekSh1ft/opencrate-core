// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import { Color } from '../math/Color.js';
import { Vec3 } from '../math/Vec3.js';

/**
 * Parallel-ray light (e.g. sunlight). Direction is derived from this light's world position
 * pointing at `target` (default: the world origin) — set `.position` to aim it.
 */
export class DirectionalLight extends Object3D {
  readonly color: Color;
  intensity: number;
  readonly target = new Vec3(0, 0, 0);

  constructor(color = new Color(1, 1, 1), intensity = 1) {
    super();
    this.name = 'DirectionalLight';
    this.color = color;
    this.intensity = intensity;
    this.position.set(1, 1, 1);
  }

  /** World-space direction FROM the light TOWARD the target (normalized). */
  getDirection(out: Vec3): Vec3 {
    this.updateMatrixWorld();
    const worldPos = this.matrixWorld.extractPosition(DirectionalLight._tmp);
    return out.copy(this.target).sub(worldPos).normalize();
  }

  private static readonly _tmp = new Vec3();
}
