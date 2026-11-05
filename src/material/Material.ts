// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

export type UniformValue =
  | number
  | number[]
  | Float32Array
  | { readonly value: unknown };

let nextMaterialId = 1;

/**
 * Base class for all materials. Owns GLSL source (vertex/fragment, as template literals
 * with `#define` feature-flag injection) and a `defines` map that forms part of the
 * program cache key `(material.type, defines)` used by `ShaderProgram`'s owning device.
 */
export abstract class Material {
  readonly id = nextMaterialId++;
  /** Class name, used as the program-cache key prefix. Set by each subclass constructor. */
  abstract readonly type: string;

  name = '';
  transparent = false;
  opacity = 1;
  wireframe = false;
  /** Disable to skip depth testing (e.g. HUD overlays). */
  depthTest = true;
  depthWrite = true;
  side: 'front' | 'back' | 'double' = 'front';

  /** Feature-flag defines injected into shader source as `#define KEY VALUE`. */
  readonly defines: Record<string, boolean | string | number> = {};

  /** Bumped when anything affecting the compiled program (defines) changes. */
  programVersion = 0;
  /** Bumped when only uniform values change (no recompile needed). */
  uniformsVersion = 0;

  /** Opaque per-device compiled-program cache entry; populated by WebGLDevice. */
  readonly _gpu = new Map<unknown, unknown>();

  abstract readonly vertexShader: string;
  abstract readonly fragmentShader: string;

  /** Returns a stable string key for the current `defines`, used in the device's program cache. */
  getDefinesKey(): string {
    const keys = Object.keys(this.defines).sort();
    return keys.map((k) => `${k}=${String(this.defines[k])}`).join(',');
  }

  protected setDefine(key: string, value: boolean | string | number | undefined): void {
    if (value === undefined || value === false) {
      if (key in this.defines) {
        delete this.defines[key];
        this.programVersion++;
      }
      return;
    }
    if (this.defines[key] !== value) {
      this.defines[key] = value;
      this.programVersion++;
    }
  }

  needsUniformUpdate(): void {
    this.uniformsVersion++;
  }

  dispose(): void {
    this._gpu.clear();
  }
}
