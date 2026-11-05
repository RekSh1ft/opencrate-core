// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

/** Mutable linear RGB color (components typically in [0, 1], HDR values allowed). */
export class Color {
  r: number;
  g: number;
  b: number;

  constructor(r = 1, g = 1, b = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  set(r: number, g: number, b: number): this {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  setHex(hex: number): this {
    this.r = ((hex >> 16) & 255) / 255;
    this.g = ((hex >> 8) & 255) / 255;
    this.b = (hex & 255) / 255;
    return this;
  }

  copy(c: Color): this {
    this.r = c.r;
    this.g = c.g;
    this.b = c.b;
    return this;
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b);
  }

  add(c: Color): this {
    this.r += c.r; this.g += c.g; this.b += c.b;
    return this;
  }

  multiply(c: Color): this {
    this.r *= c.r; this.g *= c.g; this.b *= c.b;
    return this;
  }

  scale(s: number): this {
    this.r *= s; this.g *= s; this.b *= s;
    return this;
  }

  lerp(c: Color, t: number): this {
    this.r += (c.r - this.r) * t;
    this.g += (c.g - this.g) * t;
    this.b += (c.b - this.b) * t;
    return this;
  }

  /** sRGB-encode this (currently linear) color in place. */
  toSRGB(): this {
    const f = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    this.r = f(this.r); this.g = f(this.g); this.b = f(this.b);
    return this;
  }

  toArray(out: number[] = [], offset = 0): number[] {
    out[offset] = this.r;
    out[offset + 1] = this.g;
    out[offset + 2] = this.b;
    return out;
  }
}
