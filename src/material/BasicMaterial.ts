// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Material } from './Material.js';
import { Color } from '../math/Color.js';
import type { Texture } from '../textures/Texture.js';

export interface BasicMaterialOptions {
  color?: Color;
  map?: Texture;
  vertexColors?: boolean;
  wireframe?: boolean;
  transparent?: boolean;
  opacity?: number;
}

/** Unlit material: flat color, optional texture map, optional per-vertex color. */
export class BasicMaterial extends Material {
  readonly type = 'BasicMaterial';

  readonly color: Color;
  map: Texture | undefined;
  private _vertexColors = false;

  constructor(options: BasicMaterialOptions = {}) {
    super();
    this.color = options.color ?? new Color(1, 1, 1);
    this.map = options.map;
    this.vertexColors = options.vertexColors ?? false;
    this.wireframe = options.wireframe ?? false;
    this.transparent = options.transparent ?? false;
    this.opacity = options.opacity ?? 1;
    this.setDefine('USE_MAP', this.map !== undefined);
  }

  get vertexColors(): boolean {
    return this._vertexColors;
  }

  set vertexColors(v: boolean) {
    this._vertexColors = v;
    this.setDefine('USE_VERTEX_COLORS', v);
  }

  setMap(map: Texture | undefined): this {
    this.map = map;
    this.setDefine('USE_MAP', map !== undefined);
    return this;
  }

  readonly vertexShader = /* glsl */ `#version 300 es
precision highp float;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

layout(location = 0) in vec3 a_position;
#ifdef USE_MAP
layout(location = 2) in vec2 a_uv;
out vec2 v_uv;
#endif
#ifdef USE_VERTEX_COLORS
layout(location = 3) in vec3 a_color;
out vec3 v_color;
#endif

void main() {
#ifdef USE_MAP
  v_uv = a_uv;
#endif
#ifdef USE_VERTEX_COLORS
  v_color = a_color;
#endif
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
}
`;

  readonly fragmentShader = /* glsl */ `#version 300 es
precision highp float;

uniform vec3 u_color;
uniform float u_opacity;
#ifdef USE_MAP
uniform sampler2D u_map;
in vec2 v_uv;
#endif
#ifdef USE_VERTEX_COLORS
in vec3 v_color;
#endif

out vec4 fragColor;

void main() {
  vec3 color = u_color;
#ifdef USE_VERTEX_COLORS
  color *= v_color;
#endif
#ifdef USE_MAP
  vec4 texel = texture(u_map, v_uv);
  color *= texel.rgb;
  fragColor = vec4(color, u_opacity * texel.a);
#else
  fragColor = vec4(color, u_opacity);
#endif
}
`;
}
