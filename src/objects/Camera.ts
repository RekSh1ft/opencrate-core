// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Object3D } from '../core/Object3D.js';
import { Mat4 } from '../math/Mat4.js';
import { Frustum } from '../math/Frustum.js';

/** Base class for projection-owning cameras. Subclasses implement `updateProjectionMatrix()`. */
export abstract class Camera extends Object3D {
  readonly projectionMatrix = new Mat4();
  readonly viewMatrix = new Mat4();
  /** projectionMatrix * viewMatrix, recomputed by `getFrustum()` / the renderer each frame. */
  readonly viewProjectionMatrix = new Mat4();

  abstract updateProjectionMatrix(): void;

  /** Recomputes `viewMatrix` from the current world matrix. Call after `updateMatrixWorld()`. */
  updateViewMatrix(): void {
    this.viewMatrix.copy(this.matrixWorld).invert();
  }

  /** Returns a Frustum derived from the current view-projection matrix (call after updateViewMatrix). */
  getFrustum(out = new Frustum()): Frustum {
    this.viewProjectionMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
    return out.setFromViewProjectionMatrix(this.viewProjectionMatrix);
  }
}
