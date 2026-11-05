// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Object3D } from '../core/Object3D.js';
import type { Scene } from '../core/Scene.js';
import type { Camera } from '../objects/Camera.js';
import { Mesh } from '../objects/Mesh.js';
import { Line } from '../objects/Line.js';
import { Points } from '../objects/Points.js';
import { Sphere } from '../math/Sphere.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Frustum } from '../math/Frustum.js';

export interface Renderable {
  object: Mesh | Line | Points;
  /** Squared view-space distance from the camera, used for sort order. */
  depthSq: number;
}

/**
 * Walks a scene graph, frustum-culls against the camera, and splits results into
 * depth-sorted opaque (front-to-back, for early-z) and transparent (back-to-front,
 * for correct blending) lists. Reused across frames to avoid per-frame array allocation.
 */
export class RenderList {
  readonly opaque: Renderable[] = [];
  readonly transparent: Renderable[] = [];

  private opaqueCount = 0;
  private transparentCount = 0;
  private readonly pool: Renderable[] = [];

  private getSlot(): Renderable {
    let slot = this.pool.pop();
    if (!slot) slot = { object: null as unknown as Mesh, depthSq: 0 };
    return slot;
  }

  reset(): void {
    // Return all entries from the previous frame to the pool instead of discarding the arrays.
    for (let i = 0; i < this.opaqueCount; i++) this.pool.push(this.opaque[i]!);
    for (let i = 0; i < this.transparentCount; i++) this.pool.push(this.transparent[i]!);
    this.opaque.length = 0;
    this.transparent.length = 0;
    this.opaqueCount = 0;
    this.transparentCount = 0;
  }

  gather(scene: Scene, camera: Camera, frustumCull = true): void {
    this.reset();
    camera.updateViewMatrix();
    const frustum = frustumCull ? camera.getFrustum(RenderList._frustum) : null;

    const camWorldPos = camera.getWorldPosition(RenderList._camPos);

    scene.traverseVisible((obj: Object3D) => {
      if (!isRenderable(obj)) return;

      if (frustum && !obj.geometry.boundingSphere.isEmpty()) {
        const worldSphere = transformSphereToWorld(obj.geometry.boundingSphere, obj.matrixWorld, RenderList._worldSphere);
        if (!frustum.intersectsSphere(worldSphere)) return;
      }

      const worldPos = obj.getWorldPosition(RenderList._objPos);
      const depthSq = worldPos.distanceToSquared(camWorldPos);

      const slot = this.getSlot();
      slot.object = obj;
      slot.depthSq = depthSq;

      if (obj.material.transparent) {
        this.transparent[this.transparentCount++] = slot;
      } else {
        this.opaque[this.opaqueCount++] = slot;
      }
    });

    this.opaque.length = this.opaqueCount;
    this.transparent.length = this.transparentCount;

    // Opaque: front-to-back (ascending depth) to maximize early-z rejection.
    this.opaque.sort((a, b) => a.depthSq - b.depthSq);
    // Transparent: back-to-front (descending depth) for correct alpha blending.
    this.transparent.sort((a, b) => b.depthSq - a.depthSq);
  }

  private static readonly _frustum = new Frustum();
  private static readonly _camPos = new Vec3();
  private static readonly _objPos = new Vec3();
  private static readonly _worldSphere = new Sphere();
}

function isRenderable(obj: Object3D): obj is Mesh | Line | Points {
  return obj instanceof Mesh || obj instanceof Line || obj instanceof Points;
}

function transformSphereToWorld(local: Sphere, worldMatrix: Mat4, out: Sphere): Sphere {
  const e = worldMatrix.elements;
  out.center.copy(local.center).applyMat4(worldMatrix);
  const sx = Math.hypot(e[0]!, e[1]!, e[2]!);
  const sy = Math.hypot(e[4]!, e[5]!, e[6]!);
  const sz = Math.hypot(e[8]!, e[9]!, e[10]!);
  out.radius = local.radius * Math.max(sx, sy, sz);
  return out;
}
