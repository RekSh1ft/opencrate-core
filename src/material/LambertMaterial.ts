// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Material } from './Material.js';
import { Color } from '../math/Color.js';
import type { Texture } from '../textures/Texture.js';

export interface LambertMaterialOptions {
  color?: Color;
  map?: Texture;
  transparent?: boolean;
  opacity?: number;
}

/**
 * Per-vertex Lambertian diffuse material. Lit by one ambient term and one directional light
 * (v1 scope per spec — point/spot light contributions are added in StandardMaterial).
 */
export class LambertMaterial extends Material {
  readonly type = 'LambertMaterial';

  readonly color: Color;
  map: Texture | undefined;

  constructor(options: LambertMaterialOptions = {}) {
    super();
    this.color = options.color ?? new Color(1, 1, 1);
    this.map = options.map;
    this.transparent = options.transparent ?? false;
    this.opacity = options.opacity ?? 1;
    this.setDefine('USE_MAP', this.map !== undefined);
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
uniform mat3 u_normalMatrix;

uniform vec3 u_ambientColor;
uniform vec3 u_dirLightColor;
uniform vec3 u_dirLightDirection; // view-space, normalized, points FROM surface TO light

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
#ifdef USE_MAP
layout(location = 2) in vec2 a_uv;
out vec2 v_uv;
#endif

out vec3 v_lighting;

void main() {
  vec3 viewNormal = normalize(u_normalMatrix * a_normal);
  float diffuse = max(dot(viewNormal, u_dirLightDirection), 0.0);
  v_lighting = u_ambientColor + u_dirLightColor * diffuse;

#ifdef USE_MAP
  v_uv = a_uv;
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

in vec3 v_lighting;
out vec4 fragColor;

void main() {
  vec3 color = u_color * v_lighting;
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
