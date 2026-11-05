// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { WebGLDevice, type WebGLDeviceOptions } from './WebGLDevice.js';
import type { Scene } from '../core/Scene.js';
import type { Camera } from '../objects/Camera.js';
import type { RenderTarget } from './RenderTarget.js';

export interface RendererOptions extends WebGLDeviceOptions {}

/**
 * Public rendering entry point. Wraps a `WebGLDevice`; the device abstraction exists so a
 * future `WebGPUDevice` can be swapped in without touching the scene/material/geometry layers.
 */
export class Renderer {
  private readonly device: WebGLDevice;

  constructor(canvas: HTMLCanvasElement, options: RendererOptions = {}) {
    this.device = new WebGLDevice(canvas, options);
  }

  get domElement(): HTMLCanvasElement {
    return this.device.canvas;
  }

  get drawCallCount(): number {
    return this.device.drawCallCount;
  }

  set autoClear(value: boolean) {
    this.device.autoClear = value;
  }
  get autoClear(): boolean {
    return this.device.autoClear;
  }

  /** The only resize entry point, per the API style guide. */
  setSize(cssWidth: number, cssHeight: number): void {
    this.device.setSize(cssWidth, cssHeight);
  }

  render(scene: Scene, camera: Camera, target: RenderTarget | null = null): void {
    this.device.render(scene, camera, target);
    this.device.logResourceCounts('Renderer');
  }

  dispose(): void {
    this.device.dispose();
  }
}
