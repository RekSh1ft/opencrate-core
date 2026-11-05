// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

export type UniformSetter = (value: unknown) => void;

interface UniformInfo {
  location: WebGLUniformLocation;
  type: number;
  size: number;
  /** Cached last-set value for change detection, so uniforms are only re-uploaded when they change. */
  cached: number | number[] | Float32Array | Int32Array | null;
}

interface AttributeInfo {
  location: number;
  type: number;
  size: number;
}

/**
 * Compiles and links a GLSL ES 3.00 vertex+fragment pair, with `#define` injection for
 * feature flags, readable compile errors (source annotated with line numbers), and
 * cached uniform/attribute introspection with change-detecting `setUniform*` helpers.
 */
export class ShaderProgram {
  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  private readonly uniforms = new Map<string, UniformInfo>();
  private readonly attributes = new Map<string, AttributeInfo>();

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string, defines: Record<string, boolean | string | number> = {}) {
    this.gl = gl;
    const definesBlock = buildDefinesBlock(defines);
    const vs = injectDefines(vertexSource, definesBlock);
    const fs = injectDefines(fragmentSource, definesBlock);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vs, 'vertex');
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fs, 'fragment');

    const program = gl.createProgram();
    if (!program) throw new Error('OpenCrate Core: gl.createProgram() returned null.');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? '(no log)';
      gl.deleteProgram(program);
      throw new Error(`OpenCrate Core: shader program link failed:\n${log}`);
    }

    this.program = program;
    this.introspect();
  }

  private introspect(): void {
    const gl = this.gl;
    const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(this.program, i);
      if (!info) continue;
      const name = info.name.replace(/\[0\]$/, '');
      const location = gl.getUniformLocation(this.program, info.name);
      if (!location) continue;
      this.uniforms.set(name, { location, type: info.type, size: info.size, cached: null });
    }

    const attribCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES) as number;
    for (let i = 0; i < attribCount; i++) {
      const info = gl.getActiveAttrib(this.program, i);
      if (!info) continue;
      const location = gl.getAttribLocation(this.program, info.name);
      this.attributes.set(info.name, { location, type: info.type, size: info.size });
    }
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  hasUniform(name: string): boolean {
    return this.uniforms.has(name);
  }

  getAttributeLocation(name: string): number {
    return this.attributes.get(name)?.location ?? -1;
  }

  /** Uploads a float scalar/vector/matrix uniform, skipping the GL call if the value is unchanged. */
  setUniform(name: string, value: number | number[] | Float32Array): void {
    const info = this.uniforms.get(name);
    if (!info) return; // optimized-out or absent uniform: not a programmer error, materials probe speculatively
    if (uniformUnchanged(info.cached, value)) return;
    info.cached = Array.isArray(value) || value instanceof Float32Array ? Array.from(value) : value;

    const gl = this.gl;
    const loc = info.location;
    switch (info.type) {
      case gl.FLOAT:
        gl.uniform1f(loc, value as number);
        break;
      case gl.FLOAT_VEC2:
        gl.uniform2fv(loc, value as Float32Array | number[]);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(loc, value as Float32Array | number[]);
        break;
      case gl.FLOAT_VEC4:
        gl.uniform4fv(loc, value as Float32Array | number[]);
        break;
      case gl.INT:
      case gl.SAMPLER_2D:
      case gl.SAMPLER_CUBE:
      case gl.BOOL:
        gl.uniform1i(loc, value as number);
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(loc, false, value as Float32Array | number[]);
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(loc, false, value as Float32Array | number[]);
        break;
      default:
        throw new Error(`OpenCrate Core: setUniform("${name}") — unsupported uniform type (enum ${info.type}).`);
    }
  }

  /** Uploads an array uniform (e.g. `vec3[N]`), bypassing single-value change detection. */
  setUniformArray(name: string, flatValues: Float32Array | number[]): void {
    const info = this.uniforms.get(name);
    if (!info) return;
    const gl = this.gl;
    switch (info.type) {
      case gl.FLOAT:
        gl.uniform1fv(info.location, flatValues);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(info.location, flatValues);
        break;
      case gl.INT:
        gl.uniform1iv(info.location, flatValues as unknown as Int32Array);
        break;
      default:
        throw new Error(`OpenCrate Core: setUniformArray("${name}") — unsupported uniform type (enum ${info.type}).`);
    }
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
  }
}

function buildDefinesBlock(defines: Record<string, boolean | string | number>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(defines)) {
    if (value === false) continue;
    lines.push(value === true ? `#define ${key}` : `#define ${key} ${String(value)}`);
  }
  return lines.join('\n');
}

/** Inserts the defines block immediately after the `#version` directive (required to be first by GLSL ES 3.00). */
function injectDefines(source: string, definesBlock: string): string {
  if (!definesBlock) return source;
  const versionMatch = /^#version[^\n]*\n/.exec(source);
  if (versionMatch) {
    return source.slice(0, versionMatch[0].length) + definesBlock + '\n' + source.slice(versionMatch[0].length);
  }
  return definesBlock + '\n' + source;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string, label: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error(`OpenCrate Core: gl.createShader() returned null for ${label} shader.`);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? '(no log)';
    const numbered = source
      .split('\n')
      .map((line, i) => `${String(i + 1).padStart(4, ' ')} | ${line}`)
      .join('\n');
    gl.deleteShader(shader);
    throw new Error(`OpenCrate Core: ${label} shader compile failed:\n${log}\n\n--- source ---\n${numbered}`);
  }
  return shader;
}

function uniformUnchanged(cached: UniformInfo['cached'], value: number | number[] | Float32Array): boolean {
  if (cached === null) return false;
  if (typeof value === 'number') return cached === value;
  if (!Array.isArray(cached)) return false;
  if (cached.length !== value.length) return false;
  for (let i = 0; i < value.length; i++) {
    if (cached[i] !== value[i]) return false;
  }
  return true;
}
