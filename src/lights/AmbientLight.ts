// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import { Color } from '../math/Color.js';

/** Uniform ambient term applied to every surface regardless of orientation or distance. */
export class AmbientLight extends Object3D {
  readonly color: Color;
  intensity: number;

  constructor(color = new Color(1, 1, 1), intensity = 0.2) {
    super();
    this.name = 'AmbientLight';
    this.color = color;
    this.intensity = intensity;
  }
}
