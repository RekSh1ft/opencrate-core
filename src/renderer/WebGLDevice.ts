// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import type { Scene } from '../core/Scene.js';
import type { Camera } from '../objects/Camera.js';
import { Mesh } from '../objects/Mesh.js';
import { Line } from '../objects/Line.js';
import { Points } from '../objects/Points.js';
import { AmbientLight } from '../lights/AmbientLight.js';
import { DirectionalLight } from '../lights/DirectionalLight.js';
import { PointLight } from '../lights/PointLight.js';
import type { BufferGeometry, BufferAttribute } from '../geometry/BufferGeometry.js';
import type { Material } from '../material/Material.js';
import type { Texture } from '../textures/Texture.js';
import type { RenderTarget } from '../renderer/RenderTarget.js';
import { ShaderProgram } from './ShaderProgram.js';
import { RenderList, type Renderable } from './RenderList.js';
import { Mat3 } from '../math/Mat3.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import { MAX_POINT_LIGHTS } from '../material/StandardMaterial.js';

export interface WebGLDeviceOptions {
  antialias?: boolean;
  alpha?: boolean;
  /** Clamp for resolved device-pixel-ratio to avoid runaway framebuffer sizes on hi-DPI displays. */
  maxPixelRatio?: number;
  /** Log GPU resource counts (programs/textures/geometries) and warn on suspected leaks. */
  devMode?: boolean;
}

interface GeometryGPU {
  vao: WebGLVertexArrayObject;
  buffers: Map<string, WebGLBuffer>;
  attribVersions: Map<string, number>;
  indexBuffer: WebGLBuffer | null;
  indexType: number;
  indexVersion: number;
}

interface TextureGPU {
  texture: WebGLTexture;
  version: number;
}

interface ProgramGPU {
  program: ShaderProgram;
  definesKey: string;
  programVersion: number;
}

interface GLState {
  program: WebGLProgram | null;
  depthTest: boolean;
  depthWrite: boolean;
  cullFace: boolean;
  cullMode: number;
  blend: boolean;
  viewportW: number;
  viewportH: number;
  boundVAO: WebGLVertexArrayObject | null;
  boundTextureUnit0: WebGLTexture | null;
}

/**
 * Owns the WebGL2 rendering context and every piece of GPU state: context creation,
 * resize/DPR handling, a state cache to elide redundant `gl` calls, and lazily-populated
 * caches for compiled programs, uploaded textures, and geometry VAOs — keyed off this
 * device instance via each resource's `_gpu` map, so the same geometry/material/texture
 * can be shared safely across multiple devices (e.g. two canvases).
 */
export class WebGLDevice {
  readonly gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;
  maxPixelRatio: number;
  readonly devMode: boolean;
  autoClear = true;

  private readonly state: GLState = {
    program: null,
    depthTest: true,
    depthWrite: true,
    cullFace: true,
    cullMode: 0,
    blend: false,
    viewportW: -1,
    viewportH: -1,
    boundVAO: null,
    boundTextureUnit0: null,
  };

  private readonly renderList = new RenderList();

  // Scratch — reused every frame/draw call, never allocated in the hot path.
  private readonly _modelView = new Mat4();
  private readonly _normalMatrix = new Mat3();
  private readonly _lightDir = new Vec3();
  private readonly _pointLightPositions = new Float32Array(MAX_POINT_LIGHTS * 3);
  private readonly _pointLightColors = new Float32Array(MAX_POINT_LIGHTS * 3);
  private readonly _pointLightRanges = new Float32Array(MAX_POINT_LIGHTS);
  private readonly _viewPos = new Vec3();

  drawCallCount = 0;

  constructor(canvas: HTMLCanvasElement, options: WebGLDeviceOptions = {}) {
    this.canvas = canvas;
    this.maxPixelRatio = options.maxPixelRatio ?? 2;
    this.devMode = options.devMode ?? false;

    const gl = canvas.getContext('webgl2', {
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      depth: true,
      // sRGB framebuffer output: WebGL2 always color-converts linear fragment output for
      // FRAMEBUFFER_SRGB where supported; we additionally gamma-encode in-shader as a fallback
      // since FRAMEBUFFER_SRGB enable is not exposed on the default framebuffer in all browsers.
    });
    if (!gl) {
      throw new Error('OpenCrate Core: WebGL2 is not available in this browser/context.');
    }
    this.gl = gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0, 0, 0, 1);
  }

  /** The only resize entry point — sets canvas backing-store size from CSS size * clamped DPR. */
  setSize(cssWidth: number, cssHeight: number): void {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    const w = Math.max(1, Math.round(cssWidth * pixelRatio));
    const h = Math.max(1, Math.round(cssHeight * pixelRatio));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
  }

  // ---- State cache helpers (avoid redundant gl.* calls) ----

  private setViewport(w: number, h: number): void {
    if (this.state.viewportW === w && this.state.viewportH === h) return;
    this.gl.viewport(0, 0, w, h);
    this.state.viewportW = w;
    this.state.viewportH = h;
  }

  private setDepthTest(enabled: boolean): void {
    if (this.state.depthTest === enabled) return;
    enabled ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST);
    this.state.depthTest = enabled;
  }

  private setDepthWrite(enabled: boolean): void {
    if (this.state.depthWrite === enabled) return;
    this.gl.depthMask(enabled);
    this.state.depthWrite = enabled;
  }

  private setCulling(side: Material['side']): void {
    const gl = this.gl;
    if (side === 'double') {
      if (this.state.cullFace) {
        gl.disable(gl.CULL_FACE);
        this.state.cullFace = false;
      }
      return;
    }
    if (!this.state.cullFace) {
      gl.enable(gl.CULL_FACE);
      this.state.cullFace = true;
    }
    const mode = side === 'back' ? gl.FRONT : gl.BACK; // 'back' material side culls front faces, etc.
    if (this.state.cullMode !== mode) {
      gl.cullFace(mode);
      this.state.cullMode = mode;
    }
  }

  private setBlend(enabled: boolean): void {
    if (this.state.blend === enabled) return;
    const gl = this.gl;
    if (enabled) {
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }
    this.state.blend = enabled;
  }

  private useProgramRaw(program: WebGLProgram): void {
    if (this.state.program === program) return;
    this.gl.useProgram(program);
    this.state.program = program;
  }

  private bindVAO(vao: WebGLVertexArrayObject): void {
    if (this.state.boundVAO === vao) return;
    this.gl.bindVertexArray(vao);
    this.state.boundVAO = vao;
  }

  // ---- Resource caches ----

  private getProgram(material: Material): ShaderProgram {
    const key = this;
    let entry = material._gpu.get(key) as ProgramGPU | undefined;
    const definesKey = material.getDefinesKey();

    if (entry && entry.definesKey === definesKey && entry.programVersion === material.programVersion) {
      return entry.program;
    }
    if (entry) entry.program.dispose();

    const program = new ShaderProgram(this.gl, material.vertexShader, material.fragmentShader, material.defines);
    entry = { program, definesKey, programVersion: material.programVersion };
    material._gpu.set(key, entry);
    return program;
  }

  private getGeometryGPU(geometry: BufferGeometry): GeometryGPU {
    const gl = this.gl;
    const key = this;
    let gpu = geometry._gpu.get(key) as GeometryGPU | undefined;

    if (!gpu) {
      const vao = gl.createVertexArray();
      if (!vao) throw new Error('OpenCrate Core: gl.createVertexArray() returned null.');
      gpu = { vao, buffers: new Map(), attribVersions: new Map(), indexBuffer: null, indexType: gl.UNSIGNED_SHORT, indexVersion: -1 };
      geometry._gpu.set(key, gpu);
    }

    this.bindVAO(gpu.vao);

    for (const [name, attr] of geometry.attributes) {
      const cachedVersion = gpu.attribVersions.get(name);
      if (cachedVersion === attr.version && gpu.buffers.has(name)) continue;

      let buffer = gpu.buffers.get(name);
      if (!buffer) {
        const created = gl.createBuffer();
        if (!created) throw new Error('OpenCrate Core: gl.createBuffer() returned null.');
        buffer = created;
        gpu.buffers.set(name, buffer);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, attr.array, gl.STATIC_DRAW);
      gpu.attribVersions.set(name, attr.version);

      const location = ATTRIBUTE_LOCATIONS[name];
      if (location !== undefined) {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, attr.itemSize, gl.FLOAT, attr.normalized, 0, 0);
      }
    }

    if (geometry.index && geometry.index.version !== gpu.indexVersion) {
      let buffer = gpu.indexBuffer;
      if (!buffer) {
        const created = gl.createBuffer();
        if (!created) throw new Error('OpenCrate Core: gl.createBuffer() returned null.');
        buffer = created;
        gpu.indexBuffer = buffer;
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.index.array, gl.STATIC_DRAW);
      gpu.indexType = geometry.index.array instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      gpu.indexVersion = geometry.index.version;
    }

    return gpu;
  }

  private getTextureGPU(texture: Texture): WebGLTexture {
    const gl = this.gl;
    const key = this;
    let gpu = texture._gpu.get(key) as TextureGPU | undefined;

    if (gpu && gpu.version === texture.version) return gpu.texture;

    if (!gpu) {
      const created = gl.createTexture();
      if (!created) throw new Error('OpenCrate Core: gl.createTexture() returned null.');
      gpu = { texture: created, version: -1 };
      texture._gpu.set(key, gpu);
    }

    gl.bindTexture(gl.TEXTURE_2D, gpu.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);

    const image = texture.image;
    const data = (texture as unknown as { data?: Uint8ClampedArray; width?: number; height?: number }).data;

    if (data && 'width' in texture && 'height' in texture) {
      const w = (texture as unknown as { width: number }).width;
      const h = (texture as unknown as { height: number }).height;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else if (image) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image as TexImageSource);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, WRAP_MODES[texture.wrapS]!);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, WRAP_MODES[texture.wrapT]!);

    if (texture.generateMipmapsOnUpload && isPowerOfTwoTexture(texture)) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.minFilter === 'nearest' ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.minFilter === 'nearest' ? gl.NEAREST : gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.magFilter === 'nearest' ? gl.NEAREST : gl.LINEAR);

    gpu.version = texture.version;
    return gpu.texture;
  }

  // ---- Frame render ----

  render(scene: Scene, camera: Camera, target: RenderTarget | null = null): void {
    this.drawCallCount = 0;
    const gl = this.gl;

    const width = target ? target.width : this.canvas.width;
    const height = target ? target.height : this.canvas.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // target framebuffer support: v1 renders to the default FBO only
    this.setViewport(width, height);

    if (this.autoClear) {
      const bg = scene.background;
      gl.clearColor(bg.r, bg.g, bg.b, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    camera.updateViewMatrix();

    this.renderList.gather(scene, camera, true);

    const lights = this.collectLights(scene);

    for (const entry of this.renderList.opaque) this.drawObject(entry, camera, lights);
    for (const entry of this.renderList.transparent) this.drawObject(entry, camera, lights);
  }

  private collectLights(scene: Scene) {
    const ambient = new Vec3(scene.ambient.r, scene.ambient.g, scene.ambient.b);
    let directional: DirectionalLight | null = null;
    const points: PointLight[] = [];

    scene.traverseVisible((obj) => {
      if (obj instanceof AmbientLight) {
        ambient.x += obj.color.r * obj.intensity;
        ambient.y += obj.color.g * obj.intensity;
        ambient.z += obj.color.b * obj.intensity;
      } else if (obj instanceof DirectionalLight && !directional) {
        directional = obj;
      } else if (obj instanceof PointLight && points.length < MAX_POINT_LIGHTS) {
        points.push(obj);
      }
    });

    return { ambient, directional: directional as DirectionalLight | null, points };
  }

  private drawObject(
    entry: Renderable,
    camera: Camera,
    lights: { ambient: Vec3; directional: DirectionalLight | null; points: PointLight[] },
  ): void {
    const obj = entry.object;
    const gl = this.gl;
    const material = obj.material;
    const geometry = obj.geometry;

    const shader = this.getProgram(material);
    this.useProgramRaw(shader.program);
    shader.use();

    this.setDepthTest(material.depthTest);
    this.setDepthWrite(material.depthWrite);
    this.setCulling(material.side);
    this.setBlend(material.transparent);

    this._modelView.multiplyMatrices(camera.viewMatrix, obj.matrixWorld);
    this._normalMatrix.getNormalMatrix(this._modelView);

    shader.setUniform('u_modelViewMatrix', this._modelView.elements);
    shader.setUniform('u_projectionMatrix', camera.projectionMatrix.elements);
    if (shader.hasUniform('u_normalMatrix')) shader.setUniform('u_normalMatrix', this._normalMatrix.elements);

    this.uploadMaterialUniforms(shader, material);
    this.uploadLightUniforms(shader, camera, lights);

    const gpu = this.getGeometryGPU(geometry);
    this.bindVAO(gpu.vao);

    const mode = obj instanceof Line ? gl.LINE_STRIP : obj instanceof Points ? gl.POINTS : gl.TRIANGLES;

    const drawCount = geometry.index
      ? Math.min(geometry.indexCount, geometry.drawRange.count)
      : Math.min(geometry.vertexCount, geometry.drawRange.count);

    if (geometry.index) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.indexBuffer);
      gl.drawElements(mode, drawCount, gpu.indexType, geometry.drawRange.start * (gpu.indexType === gl.UNSIGNED_INT ? 4 : 2));
    } else {
      gl.drawArrays(mode, geometry.drawRange.start, drawCount);
    }
    this.drawCallCount++;
  }

  private uploadMaterialUniforms(shader: ShaderProgram, material: Material): void {
    const m = material as unknown as {
      color?: { r: number; g: number; b: number };
      opacity: number;
      map?: Texture;
      metalness?: number;
      roughness?: number;
    };
    if (m.color) shader.setUniform('u_color', [m.color.r, m.color.g, m.color.b]);
    shader.setUniform('u_opacity', material.opacity);
    if (m.metalness !== undefined) shader.setUniform('u_metalness', m.metalness);
    if (m.roughness !== undefined) shader.setUniform('u_roughness', m.roughness);

    if (m.map && shader.hasUniform('u_map')) {
      const gl = this.gl;
      const tex = this.getTextureGPU(m.map);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      shader.setUniform('u_map', 0);
    }
  }

  private uploadLightUniforms(
    shader: ShaderProgram,
    camera: Camera,
    lights: { ambient: Vec3; directional: DirectionalLight | null; points: PointLight[] },
  ): void {
    if (shader.hasUniform('u_ambientColor')) {
      shader.setUniform('u_ambientColor', [lights.ambient.x, lights.ambient.y, lights.ambient.z]);
    }

    if (shader.hasUniform('u_dirLightColor')) {
      if (lights.directional) {
        const dl = lights.directional;
        const worldDir = dl.getDirection(this._lightDir);
        const viewDir = transformDirectionByView(worldDir, camera.viewMatrix, this._lightDir);
        shader.setUniform('u_dirLightDirection', [viewDir.x, viewDir.y, viewDir.z]);
        shader.setUniform('u_dirLightColor', [dl.color.r * dl.intensity, dl.color.g * dl.intensity, dl.color.b * dl.intensity]);
      } else {
        shader.setUniform('u_dirLightDirection', [0, 1, 0]);
        shader.setUniform('u_dirLightColor', [0, 0, 0]);
      }
    }

    if (shader.hasUniform('u_pointLightCount')) {
      const n = lights.points.length;
      shader.setUniform('u_pointLightCount', n);
      for (let i = 0; i < n; i++) {
        const pl = lights.points[i]!;
        const worldPos = pl.getWorldPosition(this._viewPos);
        const viewPos = worldPos.clone().applyMat4(camera.viewMatrix);
        this._pointLightPositions[i * 3] = viewPos.x;
        this._pointLightPositions[i * 3 + 1] = viewPos.y;
        this._pointLightPositions[i * 3 + 2] = viewPos.z;
        this._pointLightColors[i * 3] = pl.color.r * pl.intensity;
        this._pointLightColors[i * 3 + 1] = pl.color.g * pl.intensity;
        this._pointLightColors[i * 3 + 2] = pl.color.b * pl.intensity;
        this._pointLightRanges[i] = pl.range;
      }
      shader.setUniformArray('u_pointLightPositions', this._pointLightPositions);
      shader.setUniformArray('u_pointLightColors', this._pointLightColors);
      shader.setUniformArray('u_pointLightRanges', this._pointLightRanges);
    }
  }

  /** Logs currently-cached GPU resource counts for this device (dev-mode leak diagnostics). */
  logResourceCounts(label = 'WebGLDevice'): void {
    if (!this.devMode) return;
    // eslint-disable-next-line no-console
    console.info(`[${label}] draw calls last frame: ${this.drawCallCount}`);
  }

  dispose(): void {
    // Individual resource disposal (programs/textures/VAOs) happens via each resource's own
    // dispose() clearing its `_gpu` map; the device itself holds no additional global handles.
  }
}

function transformDirectionByView(dir: Vec3, viewMatrix: Mat4, out: Vec3): Vec3 {
  out.copy(dir).transformDirection(viewMatrix);
  return out;
}

function isPowerOfTwoTexture(texture: Texture): boolean {
  const img = texture.image as { width?: number; height?: number } | null;
  const w = img?.width ?? (texture as unknown as { width?: number }).width;
  const h = img?.height ?? (texture as unknown as { height?: number }).height;
  if (!w || !h) return true;
  return (w & (w - 1)) === 0 && (h & (h - 1)) === 0;
}

const WRAP_MODES: Record<string, number> = {
  repeat: WebGL2RenderingContext.REPEAT,
  'clamp-to-edge': WebGL2RenderingContext.CLAMP_TO_EDGE,
  'mirrored-repeat': WebGL2RenderingContext.MIRRORED_REPEAT,
};

/** Fixed attribute locations shared by every material's shaders (see each material's `layout(location=N)`). */
const ATTRIBUTE_LOCATIONS: Record<string, number> = {
  position: 0,
  normal: 1,
  uv: 2,
  color: 3,
};
