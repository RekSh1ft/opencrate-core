// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';

/** Transform-only container with no renderable payload — groups objects for shared transforms. */
export class Group extends Object3D {
  constructor() {
    super();
    this.name = 'Group';
  }

  override clone(recursive = true): Group {
    const copy = new Group();
    copy.copy(this, recursive);
    return copy;
  }
}
