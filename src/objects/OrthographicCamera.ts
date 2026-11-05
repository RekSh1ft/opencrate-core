// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Camera } from './Camera.js';

/** Orthographic projection camera, defined by a view-space box (left/right/top/bottom/near/far). */
export class OrthographicCamera extends Camera {
  left: number;
  right: number;
  top: number;
  bottom: number;
  near: number;
  far: number;

  constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000) {
    super();
    this.name = 'OrthographicCamera';
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.near = near;
    this.far = far;
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix(): void {
    this.projectionMatrix.makeOrthographic(this.left, this.right, this.top, this.bottom, this.near, this.far);
  }

  override clone(recursive = true): OrthographicCamera {
    const copy = new OrthographicCamera(this.left, this.right, this.top, this.bottom, this.near, this.far);
    copy.copy(this, recursive);
    return copy;
  }
}
