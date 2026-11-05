// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Material } from './Material.js';
import { Color } from '../math/Color.js';
import type { Texture } from '../textures/Texture.js';

export interface StandardMaterialOptions {
  color?: Color;
  map?: Texture;
  metalness?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
}

/** Maximum point lights contributing to a StandardMaterial surface in a single pass (v1 scope). */
export const MAX_POINT_LIGHTS = 4;

/**
 * Simplified PBR material: GGX normal distribution + Schlick Fresnel + Smith visibility,
 * lit by one directional light, up to `MAX_POINT_LIGHTS` point lights, and ambient. No IBL
 * in v1 — ambient is a flat term, not a convolved environment map.
 */
export class StandardMaterial extends Material {
  readonly type = 'StandardMaterial';

  readonly color: Color;
  map: Texture | undefined;
  metalness: number;
  roughness: number;

  constructor(options: StandardMaterialOptions = {}) {
    super();
    this.color = options.color ?? new Color(1, 1, 1);
    this.map = options.map;
    this.metalness = options.metalness ?? 0.0;
    this.roughness = options.roughness ?? 0.5;
    this.transparent = options.transparent ?? false;
    this.opacity = options.opacity ?? 1;
    this.setDefine('USE_MAP', this.map !== undefined);
    this.setDefine('MAX_POINT_LIGHTS', MAX_POINT_LIGHTS);
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

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
#ifdef USE_MAP
layout(location = 2) in vec2 a_uv;
out vec2 v_uv;
#endif

out vec3 v_viewNormal;
out vec3 v_viewPosition;

void main() {
  vec4 viewPos = u_modelViewMatrix * vec4(a_position, 1.0);
  v_viewPosition = viewPos.xyz;
  v_viewNormal = normalize(u_normalMatrix * a_normal);
#ifdef USE_MAP
  v_uv = a_uv;
#endif
  gl_Position = u_projectionMatrix * viewPos;
}
`;

  readonly fragmentShader = /* glsl */ `#version 300 es
precision highp float;

#define PI 3.14159265359

uniform vec3 u_color;
uniform float u_metalness;
uniform float u_roughness;
uniform float u_opacity;
#ifdef USE_MAP
uniform sampler2D u_map;
in vec2 v_uv;
#endif

uniform vec3 u_ambientColor;
uniform vec3 u_dirLightColor;
uniform vec3 u_dirLightDirection; // view-space, points FROM surface TO light

uniform int u_pointLightCount;
uniform vec3 u_pointLightPositions[MAX_POINT_LIGHTS];  // view-space
uniform vec3 u_pointLightColors[MAX_POINT_LIGHTS];
uniform float u_pointLightRanges[MAX_POINT_LIGHTS];

in vec3 v_viewNormal;
in vec3 v_viewPosition;
out vec4 fragColor;

float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  return a2 / (PI * denom * denom + 1e-7);
}

float geometrySmith(float NdotV, float NdotL, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  float ggxV = NdotV / (NdotV * (1.0 - k) + k);
  float ggxL = NdotL / (NdotL * (1.0 - k) + k);
  return ggxV * ggxL;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 shadeLight(vec3 N, vec3 V, vec3 L, vec3 radiance, vec3 albedo, float metalness, float roughness) {
  vec3 H = normalize(V + L);
  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(dot(N, V), 1e-4);
  if (NdotL <= 0.0) return vec3(0.0);

  vec3 F0 = mix(vec3(0.04), albedo, metalness);
  float D = distributionGGX(N, H, roughness);
  float G = geometrySmith(NdotV, NdotL, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  vec3 numerator = D * G * F;
  float denom = 4.0 * NdotV * NdotL + 1e-4;
  vec3 specular = numerator / denom;

  vec3 kD = (vec3(1.0) - F) * (1.0 - metalness);
  vec3 diffuse = kD * albedo / PI;

  return (diffuse + specular) * radiance * NdotL;
}

void main() {
  vec3 albedo = u_color;
#ifdef USE_MAP
  vec4 texel = texture(u_map, v_uv);
  albedo *= texel.rgb;
#endif

  vec3 N = normalize(v_viewNormal);
  vec3 V = normalize(-v_viewPosition);

  vec3 Lo = vec3(0.0);

  // Directional light.
  Lo += shadeLight(N, V, normalize(u_dirLightDirection), u_dirLightColor, albedo, u_metalness, u_roughness);

  // Point lights (simple inverse-square with a soft range cutoff).
  for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
    if (i >= u_pointLightCount) break;
    vec3 toLight = u_pointLightPositions[i] - v_viewPosition;
    float dist = length(toLight);
    vec3 L = toLight / max(dist, 1e-4);
    float range = u_pointLightRanges[i];
    float atten = 1.0 / (1.0 + dist * dist);
    if (range > 0.0) atten *= clamp(1.0 - pow(dist / range, 4.0), 0.0, 1.0);
    Lo += shadeLight(N, V, L, u_pointLightColors[i] * atten, albedo, u_metalness, u_roughness);
  }

  vec3 ambient = u_ambientColor * albedo;
  vec3 color = ambient + Lo;

#ifdef USE_MAP
  fragColor = vec4(color, u_opacity * texel.a);
#else
  fragColor = vec4(color, u_opacity);
#endif
}
`;
}
