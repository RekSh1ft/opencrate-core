// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import { Color } from '../math/Color.js';

/** Omnidirectional point light with inverse-square falloff and an optional hard range cutoff. */
export class PointLight extends Object3D {
  readonly color: Color;
  intensity: number;
  /** Distance at which the light's contribution is fully attenuated to zero. 0 = no cutoff. */
  range: number;

  constructor(color = new Color(1, 1, 1), intensity = 1, range = 0) {
    super();
    this.name = 'PointLight';
    this.color = color;
    this.intensity = intensity;
    this.range = range;
  }
}
