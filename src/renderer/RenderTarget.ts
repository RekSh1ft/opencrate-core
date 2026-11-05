// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

/**
 * CPU-side description of an offscreen render target (color + depth). The device lazily
 * creates the backing WebGL framebuffer/renderbuffers and recreates them on resize.
 */
export class RenderTarget {
  width: number;
  height: number;
  depthBuffer: boolean;
  /** Bumped on resize so the device knows to recreate its framebuffer. */
  version = 0;

  /** Opaque per-device GPU handle cache; populated by WebGLDevice. */
  readonly _gpu = new Map<unknown, unknown>();

  constructor(width: number, height: number, depthBuffer = true) {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.depthBuffer = depthBuffer;
  }

  setSize(width: number, height: number): this {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    if (w === this.width && h === this.height) return this;
    this.width = w;
    this.height = h;
    this.version++;
    return this;
  }

  dispose(): void {
    this._gpu.clear();
  }
}
