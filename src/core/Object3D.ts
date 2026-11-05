// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Vec3 } from '../math/Vec3.js';
import { Quat } from '../math/Quat.js';
import { Euler } from '../math/Euler.js';
import { Mat4 } from '../math/Mat4.js';
import { EventDispatcher, type EngineEvent } from './EventDispatcher.js';

let nextId = 1;

export interface Object3DEventMap extends Record<string, EngineEvent> {
  added: EngineEvent;
  removed: EngineEvent;
  childadded: EngineEvent & { child: Object3D };
  childremoved: EngineEvent & { child: Object3D };
}

/**
 * Base node of the scene graph. Owns a local transform (position/quaternion/scale),
 * derives a world matrix lazily via a dirty-flag, and supports parent/child nesting.
 * `Scene`, `Mesh`, `Camera`, lights, and `Group` all extend this.
 */
export class Object3D extends EventDispatcher<Object3DEventMap> {
  readonly id: number = nextId++;
  name = '';

  readonly position = new Vec3(0, 0, 0);
  readonly quaternion = new Quat();
  readonly scale = new Vec3(1, 1, 1);

  readonly matrix = new Mat4();
  readonly matrixWorld = new Mat4();

  parent: Object3D | null = null;
  readonly children: Object3D[] = [];

  visible = true;
  /** When false, this object and descendants are skipped by RenderList gathering. */
  castShadow = false;
  receiveShadow = false;
  /** Arbitrary user data bag — engine never reads or writes to this itself. */
  readonly userData: Record<string, unknown> = {};

  private matrixDirty = true;
  private worldMatrixNeedsUpdate = true;

  /** Preferred rotation order used when reading `.rotation` (quaternion is always the source of truth). */
  rotationOrder: Euler['order'] = 'XYZ';

  /**
   * Euler view of the current orientation, decomposed from `quaternion` on each read via the
   * current `matrix`. The quaternion is the engine's single source of truth for rotation (per the
   * API style guide); this getter is a convenience and is not cached, so prefer `quaternion` /
   * `setRotationFromEuler()` in hot code paths.
   */
  get rotation(): Euler {
    const out = new Euler(0, 0, 0, this.rotationOrder);
    Object3D._tmpMat.makeRotationFromQuat(this.quaternion);
    eulerFromRotationMatrix(Object3D._tmpMat, out);
    return out;
  }

  setRotationFromEuler(e: Euler): this {
    this.quaternion.fromEuler(e);
    this.rotationOrder = e.order;
    this.markDirty();
    return this;
  }

  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    this.markDirty();
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    this.markDirty();
    return this;
  }

  /** Marks this object's local matrix (and the whole subtree's world matrices) as needing recompute. */
  markDirty(): void {
    this.matrixDirty = true;
    this.markWorldDirty();
  }

  private markWorldDirty(): void {
    if (this.worldMatrixNeedsUpdate) return; // already propagating / propagated
    this.worldMatrixNeedsUpdate = true;
    for (const child of this.children) child.markWorldDirty();
  }

  add(...objects: Object3D[]): this {
    for (const obj of objects) {
      if (obj === this) {
        throw new Error('OpenCrate Core: Object3D.add() cannot add an object to itself.');
      }
      if (obj.parent) obj.parent.remove(obj);
      obj.parent = this;
      this.children.push(obj);
      obj.markDirty();
      obj.dispatchEvent({ type: 'added' });
      this.dispatchEvent<'childadded'>({ type: 'childadded', child: obj });
    }
    return this;
  }

  remove(...objects: Object3D[]): this {
    for (const obj of objects) {
      const idx = this.children.indexOf(obj);
      if (idx === -1) continue;
      this.children.splice(idx, 1);
      obj.parent = null;
      obj.dispatchEvent({ type: 'removed' });
      this.dispatchEvent<'childremoved'>({ type: 'childremoved', child: obj });
    }
    return this;
  }

  removeFromParent(): this {
    this.parent?.remove(this);
    return this;
  }

  traverse(callback: (obj: Object3D) => void): void {
    callback(this);
    for (const child of this.children) child.traverse(callback);
  }

  traverseVisible(callback: (obj: Object3D) => void): void {
    if (!this.visible) return;
    callback(this);
    for (const child of this.children) child.traverseVisible(callback);
  }

  /** Recomputes `matrix` from position/quaternion/scale if dirty. */
  updateMatrix(): void {
    if (!this.matrixDirty) return;
    this.matrix.compose(this.position, this.quaternion, this.scale);
    this.matrixDirty = false;
  }

  /**
   * Recomputes `matrixWorld` for this node and its subtree. Call once per frame from the
   * root (Scene). Skips subtrees whose world matrix is already up to date.
   */
  updateMatrixWorld(parentWorldDirty = false): void {
    this.updateMatrix();
    const dirty = parentWorldDirty || this.worldMatrixNeedsUpdate;

    if (dirty) {
      if (this.parent) {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      } else {
        this.matrixWorld.copy(this.matrix);
      }
      this.worldMatrixNeedsUpdate = false;
    }

    for (const child of this.children) {
      child.updateMatrixWorld(dirty);
    }
  }

  lookAt(target: Vec3): this {
    const worldPos = this.matrixWorld.extractPosition(Object3D._tmpVec);
    const m = Object3D._tmpMat.lookAt(worldPos, target, Object3D._tmpUp);
    this.quaternion.fromMat4(m);
    this.markDirty();
    return this;
  }

  getWorldPosition(out: Vec3): Vec3 {
    this.updateMatrixWorld();
    return this.matrixWorld.extractPosition(out);
  }

  clone(recursive = true): Object3D {
    const copy = new Object3D();
    copy.copy(this, recursive);
    return copy;
  }

  copy(source: Object3D, recursive = true): this {
    this.name = source.name;
    this.position.copy(source.position);
    this.quaternion.copy(source.quaternion);
    this.scale.copy(source.scale);
    this.visible = source.visible;
    this.castShadow = source.castShadow;
    this.receiveShadow = source.receiveShadow;
    this.markDirty();

    if (recursive) {
      for (const child of source.children) this.add(child.clone(true));
    }
    return this;
  }

  /** Override in subclasses that own GPU resources (geometry/material/texture). Base is a no-op. */
  dispose(): void {
    for (const child of this.children) child.dispose();
  }

  private static readonly _tmpVec = new Vec3();
  private static readonly _tmpMat = new Mat4();
  private static readonly _tmpUp = new Vec3(0, 1, 0);
}

/** Decomposes a pure-rotation Mat4 into an Euler triple for the given order. Not allocation-free; not hot-path. */
function eulerFromRotationMatrix(m: Mat4, out: Euler): Euler {
  const e = m.elements;
  const m11 = e[0]!, m12 = e[4]!, m13 = e[8]!;
  const m21 = e[1]!, m22 = e[5]!, m23 = e[9]!;
  const m31 = e[2]!, m32 = e[6]!, m33 = e[10]!;
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));

  switch (out.order) {
    case 'XYZ':
      out.y = Math.asin(clamp(m13));
      if (Math.abs(m13) < 0.9999999) {
        out.x = Math.atan2(-m23, m33);
        out.z = Math.atan2(-m12, m11);
      } else {
        out.x = Math.atan2(m32, m22);
        out.z = 0;
      }
      break;
    case 'YXZ':
      out.x = Math.asin(-clamp(m23));
      if (Math.abs(m23) < 0.9999999) {
        out.y = Math.atan2(m13, m33);
        out.z = Math.atan2(m21, m22);
      } else {
        out.y = Math.atan2(-m31, m11);
        out.z = 0;
      }
      break;
    case 'ZXY':
      out.x = Math.asin(clamp(m32));
      if (Math.abs(m32) < 0.9999999) {
        out.y = Math.atan2(-m31, m33);
        out.z = Math.atan2(-m12, m22);
      } else {
        out.y = 0;
        out.z = Math.atan2(m21, m11);
      }
      break;
    default:
      // Remaining orders (ZYX, YZX, XZY) fall back to XYZ extraction then re-tag; acceptable for
      // a convenience getter — callers needing exact support for those orders should track Euler
      // state themselves and drive the quaternion via fromEuler().
      out.y = Math.asin(clamp(m13));
      out.x = Math.atan2(-m23, m33);
      out.z = Math.atan2(-m12, m11);
      break;
  }
  return out;
}
