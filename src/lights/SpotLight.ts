// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import { Color } from '../math/Color.js';
import { Vec3 } from '../math/Vec3.js';

/** Cone-shaped light aimed from `.position` at `.target`, with inner/outer angle falloff. */
export class SpotLight extends Object3D {
  readonly color: Color;
  intensity: number;
  range: number;
  /** Outer cone half-angle, radians. */
  angle: number;
  /** 0..1 fraction of `angle` where falloff begins (1 = hard edge). */
  penumbra: number;
  readonly target = new Vec3(0, 0, 0);

  constructor(color = new Color(1, 1, 1), intensity = 1, range = 0, angle = Math.PI / 6, penumbra = 0.1) {
    super();
    this.name = 'SpotLight';
    this.color = color;
    this.intensity = intensity;
    this.range = range;
    this.angle = angle;
    this.penumbra = penumbra;
  }

  getDirection(out: Vec3): Vec3 {
    this.updateMatrixWorld();
    const worldPos = this.matrixWorld.extractPosition(SpotLight._tmp);
    return out.copy(this.target).sub(worldPos).normalize();
  }

  private static readonly _tmp = new Vec3();
}
