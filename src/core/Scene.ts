// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from './Object3D.js';
import { Color } from '../math/Color.js';

/** Root node of a scene graph. Holds render-wide state like background color. */
export class Scene extends Object3D {
  readonly background = new Color(0.05, 0.06, 0.08);
  /** Uniform fog-free ambient term applied by LambertMaterial/StandardMaterial when no AmbientLight is present. */
  readonly ambient = new Color(0, 0, 0);

  constructor() {
    super();
    this.name = 'Scene';
  }

  override clone(recursive = true): Scene {
    const copy = new Scene();
    copy.copy(this, recursive);
    copy.background.copy(this.background);
    copy.ambient.copy(this.ambient);
    return copy;
  }
}
