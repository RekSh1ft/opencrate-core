// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Sphere } from '../math/Sphere.js';

export type TypedArray = Float32Array | Uint16Array | Uint32Array | Int16Array | Uint8Array;

/** CPU-side description of one vertex attribute (position, normal, uv, color, ...). */
export class BufferAttribute {
  readonly array: TypedArray;
  readonly itemSize: number;
  normalized: boolean;
  /** Bumped whenever `array` contents change in place, so the Device knows to re-upload. */
  version = 0;

  constructor(array: TypedArray, itemSize: number, normalized = false) {
    this.array = array;
    this.itemSize = itemSize;
    this.normalized = normalized;
  }

  get count(): number {
    return this.array.length / this.itemSize;
  }

  needsUpdate(): void {
    this.version++;
  }
}

export interface DrawRange {
  start: number;
  count: number;
}

/**
 * CPU-side mesh data: named vertex attributes plus an optional index buffer.
 * The renderer lazily creates and caches a WebGL VAO per (device, geometry) pair —
 * see `renderer/WebGLDevice.ts`'s internal geometry cache.
 */
export class BufferGeometry {
  readonly attributes = new Map<string, BufferAttribute>();
  index: BufferAttribute | null = null;
  readonly boundingSphere = new Sphere();
  drawRange: DrawRange = { start: 0, count: Infinity };

  /** Opaque per-device GPU handle cache; populated by WebGLDevice, read nowhere else. */
  readonly _gpu = new Map<unknown, unknown>();

  setAttribute(name: string, attribute: BufferAttribute): this {
    this.attributes.set(name, attribute);
    return this;
  }

  getAttribute(name: string): BufferAttribute | undefined {
    return this.attributes.get(name);
  }

  deleteAttribute(name: string): this {
    this.attributes.delete(name);
    return this;
  }

  setIndex(index: BufferAttribute | number[] | null): this {
    if (index === null) {
      this.index = null;
    } else if (Array.isArray(index)) {
      const max = index.length ? Math.max(...index) : 0;
      const arr = max > 65535 ? new Uint32Array(index) : new Uint16Array(index);
      this.index = new BufferAttribute(arr, 1);
    } else {
      this.index = index;
    }
    return this;
  }

  setDrawRange(start: number, count: number): this {
    this.drawRange = { start, count };
    return this;
  }

  get vertexCount(): number {
    return this.getAttribute('position')?.count ?? 0;
  }

  get indexCount(): number {
    return this.index?.count ?? 0;
  }

  /** Computes `boundingSphere` from the position attribute. Call after mutating positions. */
  computeBoundingSphere(): this {
    const pos = this.getAttribute('position');
    if (!pos) {
      this.boundingSphere.radius = 0;
      return this;
    }
    this.boundingSphere.setFromPoints(pos.array);
    return this;
  }

  dispose(): void {
    // GPU-side cleanup is handled by whichever WebGLDevice created entries in `_gpu`;
    // Renderer.dispose() walks geometries and releases VAOs/buffers before this returns.
    this._gpu.clear();
  }
}
