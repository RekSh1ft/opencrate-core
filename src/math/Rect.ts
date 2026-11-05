// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

/** Mutable axis-aligned rectangle (x, y, width, height), used for viewports and scissor rects. */
export class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  copy(r: Rect): this {
    this.x = r.x; this.y = r.y; this.width = r.width; this.height = r.height;
    return this;
  }

  clone(): Rect {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  containsPoint(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  equals(r: Rect): boolean {
    return this.x === r.x && this.y === r.y && this.width === r.width && this.height === r.height;
  }
}
