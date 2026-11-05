// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Camera } from './Camera.js';

/** Perspective projection camera. `fov` is the full vertical field of view, in degrees. */
export class PerspectiveCamera extends Camera {
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.name = 'PerspectiveCamera';
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix(): void {
    const fovRad = (this.fov * Math.PI) / 180;
    this.projectionMatrix.makePerspective(fovRad, this.aspect, this.near, this.far);
  }

  /** Convenience for resize handlers: sets aspect from pixel dimensions and recomputes the projection. */
  setAspectFromSize(width: number, height: number): void {
    this.aspect = height === 0 ? 1 : width / height;
    this.updateProjectionMatrix();
  }

  override clone(recursive = true): PerspectiveCamera {
    const copy = new PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    copy.copy(this, recursive);
    return copy;
  }
}
