// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Camera } from '../objects/Camera.js';
import { Vec3 } from '../math/Vec3.js';

export interface OrbitControlsOptions {
  dampingFactor?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

/**
 * Damped orbit/pan/zoom controller driving a camera around `target`, via pointer events
 * (mouse + touch, unified through the Pointer Events API) and wheel. Call `update()` once
 * per frame to apply damping, and `dispose()` to remove listeners.
 */
export class OrbitControls {
  readonly camera: Camera;
  readonly domElement: HTMLElement;
  readonly target = new Vec3(0, 0, 0);

  enabled = true;
  dampingFactor: number;
  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;

  // Spherical state around `target`: radius, polar angle (from +Y), azimuthal angle (around +Y).
  private radius = 5;
  private polar = Math.PI / 2;
  private azimuth = 0;

  private polarVelocity = 0;
  private azimuthVelocity = 0;
  private radiusVelocity = 0;
  private readonly panVelocity = new Vec3(0, 0, 0);
  private readonly panOffset = new Vec3(0, 0, 0);

  private pointers = new Map<number, { x: number; y: number }>();
  private lastPinchDist = 0;
  private dragButton: 'rotate' | 'pan' | null = null;

  constructor(camera: Camera, domElement: HTMLElement, options: OrbitControlsOptions = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.dampingFactor = options.dampingFactor ?? 0.08;
    this.rotateSpeed = options.rotateSpeed ?? 0.005;
    this.zoomSpeed = options.zoomSpeed ?? 0.1;
    this.panSpeed = options.panSpeed ?? 0.002;
    this.minDistance = options.minDistance ?? 0.5;
    this.maxDistance = options.maxDistance ?? 500;
    this.minPolarAngle = options.minPolarAngle ?? 0.01;
    this.maxPolarAngle = options.maxPolarAngle ?? Math.PI - 0.01;

    this.syncSphericalFromCamera();

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('wheel', this.onWheel, { passive: false });
    domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private syncSphericalFromCamera(): void {
    const offset = scratchOffset.copy(this.camera.position).sub(this.target);
    this.radius = Math.max(offset.length(), 1e-4);
    this.polar = Math.acos(clamp(offset.y / this.radius, -1, 1));
    this.azimuth = Math.atan2(offset.x, offset.z);
  }

  private onContextMenu(e: Event): void {
    e.preventDefault();
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.enabled) return;
    this.domElement.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1) {
      this.dragButton = e.button === 2 || e.shiftKey ? 'pan' : 'rotate';
      this.domElement.addEventListener('pointermove', this.onPointerMove);
      this.domElement.addEventListener('pointerup', this.onPointerUp);
      this.domElement.addEventListener('pointercancel', this.onPointerUp);
    } else if (this.pointers.size === 2) {
      this.lastPinchDist = this.pinchDistance();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.enabled) return;
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 2) {
      const dist = this.pinchDistance();
      const delta = dist - this.lastPinchDist;
      this.radiusVelocity -= delta * this.zoomSpeed * 0.1;
      this.lastPinchDist = dist;
      return;
    }

    if (this.dragButton === 'rotate') {
      this.azimuthVelocity -= dx * this.rotateSpeed;
      this.polarVelocity -= dy * this.rotateSpeed;
    } else if (this.dragButton === 'pan') {
      this.panVelocity.x -= dx * this.panSpeed * this.radius;
      this.panVelocity.y += dy * this.panSpeed * this.radius;
    }
  }

  private onPointerUp(e: PointerEvent): void {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) {
      this.dragButton = null;
      this.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.removeEventListener('pointerup', this.onPointerUp);
      this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!this.enabled) return;
    e.preventDefault();
    this.radiusVelocity += e.deltaY * this.zoomSpeed * 0.01;
  }

  private pinchDistance(): number {
    const pts = Array.from(this.pointers.values());
    if (pts.length < 2) return 0;
    const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Applies accumulated input with damping and writes the result into the camera transform. Call once per frame. */
  update(): void {
    if (!this.enabled) return;

    this.azimuth += this.azimuthVelocity;
    this.polar += this.polarVelocity;
    this.radius += this.radiusVelocity;

    this.polar = clamp(this.polar, this.minPolarAngle, this.maxPolarAngle);
    this.radius = clamp(this.radius, this.minDistance, this.maxDistance);

    this.panOffset.addScaledVector(this.panVelocity, 1);
    this.target.add(this.panOffset);
    this.panOffset.set(0, 0, 0);

    const damp = 1 - this.dampingFactor;
    this.azimuthVelocity *= damp;
    this.polarVelocity *= damp;
    this.radiusVelocity *= damp;
    this.panVelocity.scale(damp);

    const sinPolar = Math.sin(this.polar);
    const x = this.target.x + this.radius * sinPolar * Math.sin(this.azimuth);
    const y = this.target.y + this.radius * Math.cos(this.polar);
    const z = this.target.z + this.radius * sinPolar * Math.cos(this.azimuth);

    this.camera.position.set(x, y, z);
    this.camera.markDirty();
    this.camera.lookAt(this.target);
  }

  dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.pointers.clear();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Module-level scratch vector — avoids a per-call allocation in `syncSphericalFromCamera()`. */
const scratchOffset = new Vec3();
