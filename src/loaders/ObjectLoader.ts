// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

import { Scene } from '../core/Scene.js';
import { Object3D } from '../core/Object3D.js';
import { Group } from '../objects/Group.js';
import { Mesh } from '../objects/Mesh.js';
import { Color } from '../math/Color.js';

import { BufferGeometry } from '../geometry/BufferGeometry.js';
import { BoxGeometry } from '../geometry/BoxGeometry.js';
import { SphereGeometry } from '../geometry/SphereGeometry.js';
import { PlaneGeometry } from '../geometry/PlaneGeometry.js';
import { CylinderGeometry } from '../geometry/CylinderGeometry.js';
import { TorusGeometry } from '../geometry/TorusGeometry.js';

import { Material } from '../material/Material.js';
import { BasicMaterial } from '../material/BasicMaterial.js';
import { LambertMaterial } from '../material/LambertMaterial.js';
import { StandardMaterial } from '../material/StandardMaterial.js';

interface JSONGeometryRef {
  type: 'Box' | 'Sphere' | 'Plane' | 'Cylinder' | 'Torus';
  params: number[];
}

interface JSONMaterial {
  type: 'BasicMaterial' | 'LambertMaterial' | 'StandardMaterial';
  color?: [number, number, number];
  opacity?: number;
  transparent?: boolean;
  metalness?: number;
  roughness?: number;
}

interface JSONObject {
  type: 'Group' | 'Mesh' | 'Object3D';
  name?: string;
  position?: [number, number, number];
  quaternion?: [number, number, number, number];
  scale?: [number, number, number];
  visible?: boolean;
  geometry?: string; // key into the top-level `geometries` map
  material?: JSONMaterial; // inline, per spec
  children?: JSONObject[];
}

export interface SceneJSON {
  background?: [number, number, number];
  geometries: Record<string, JSONGeometryRef>;
  root: JSONObject;
}

/** Serializes/deserializes a `Scene` to/from a plain-JSON representation (geometries referenced
 *  by name + primitive params, materials inlined, transforms and hierarchy preserved). */
export class ObjectLoader {
  parse(json: SceneJSON): Scene {
    const geometryCache = new Map<string, BufferGeometry>();
    for (const [name, ref] of Object.entries(json.geometries)) {
      geometryCache.set(name, buildGeometry(ref));
    }

    const scene = new Scene();
    if (json.background) scene.background.set(...json.background);

    this.buildChildren(scene, json.root.children ?? [], geometryCache);
    return scene;
  }

  private buildChildren(parent: Object3D, children: JSONObject[], geometries: Map<string, BufferGeometry>): void {
    for (const def of children) {
      const obj = this.buildObject(def, geometries);
      parent.add(obj);
      if (def.children) this.buildChildren(obj, def.children, geometries);
    }
  }

  private buildObject(def: JSONObject, geometries: Map<string, BufferGeometry>): Object3D {
    let obj: Object3D;

    if (def.type === 'Mesh') {
      const geometry = def.geometry ? geometries.get(def.geometry) : undefined;
      if (!geometry) {
        throw new Error(`OpenCrate Core: ObjectLoader — Mesh "${def.name ?? '(unnamed)'}" references unknown geometry "${String(def.geometry)}".`);
      }
      const material = def.material ? buildMaterial(def.material) : new BasicMaterial();
      obj = new Mesh(geometry, material);
    } else if (def.type === 'Group') {
      obj = new Group();
    } else {
      obj = new Object3D();
    }

    if (def.name) obj.name = def.name;
    if (def.position) obj.position.set(...def.position);
    if (def.quaternion) obj.quaternion.set(...def.quaternion);
    if (def.scale) obj.scale.set(...def.scale);
    if (def.visible !== undefined) obj.visible = def.visible;
    obj.markDirty();

    return obj;
  }

  toJSON(scene: Scene): SceneJSON {
    const geometries: Record<string, JSONGeometryRef> = {};
    const geometryNames = new Map<BufferGeometry, string>();
    let geomCounter = 0;

    const root = this.objectToJSON(scene, (geom) => {
      let name = geometryNames.get(geom);
      if (!name) {
        name = `geom_${geomCounter++}`;
        geometryNames.set(geom, name);
        const ref = geometryToJSON(geom);
        if (ref) geometries[name] = ref;
      }
      return name;
    });

    return {
      background: [scene.background.r, scene.background.g, scene.background.b],
      geometries,
      root,
    };
  }

  private objectToJSON(obj: Object3D, registerGeometry: (g: BufferGeometry) => string): JSONObject {
    const def: JSONObject = {
      type: obj instanceof Mesh ? 'Mesh' : obj instanceof Group ? 'Group' : 'Object3D',
      name: obj.name || undefined,
      position: [obj.position.x, obj.position.y, obj.position.z],
      quaternion: [obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      visible: obj.visible,
    };

    if (obj instanceof Mesh) {
      def.geometry = registerGeometry(obj.geometry);
      def.material = materialToJSON(obj.material);
    }

    if (obj.children.length) {
      def.children = obj.children.map((c) => this.objectToJSON(c, registerGeometry));
    }
    return def;
  }
}

function buildGeometry(ref: JSONGeometryRef): BufferGeometry {
  const p = ref.params;
  switch (ref.type) {
    case 'Box':
      return new BoxGeometry(p[0]!, p[1]!, p[2]!);
    case 'Sphere':
      return new SphereGeometry(p[0]!, p[1]!, p[2]!);
    case 'Plane':
      return new PlaneGeometry(p[0]!, p[1]!, p[2]!, p[3]!);
    case 'Cylinder':
      return new CylinderGeometry(p[0]!, p[1]!, p[2]!, p[3]!, p[4]!);
    case 'Torus':
      return new TorusGeometry(p[0]!, p[1]!, p[2]!, p[3]!);
    default:
      throw new Error(`OpenCrate Core: ObjectLoader — unknown geometry type "${String(ref.type)}".`);
  }
}

function geometryToJSON(geom: BufferGeometry): JSONGeometryRef | null {
  if (geom instanceof BoxGeometry) return { type: 'Box', params: geom.params };
  if (geom instanceof SphereGeometry) return { type: 'Sphere', params: geom.params };
  if (geom instanceof PlaneGeometry) return { type: 'Plane', params: geom.params };
  if (geom instanceof CylinderGeometry) return { type: 'Cylinder', params: geom.params };
  if (geom instanceof TorusGeometry) return { type: 'Torus', params: geom.params };
  // Arbitrary BufferGeometry instances aren't round-trippable through the primitive-params
  // schema in v1 — the ObjectLoader only serializes the five built-in primitives.
  return null;
}

function buildMaterial(def: JSONMaterial): Material {
  const color = def.color ? new Color(...def.color) : undefined;
  switch (def.type) {
    case 'BasicMaterial':
      return new BasicMaterial({ color, opacity: def.opacity, transparent: def.transparent });
    case 'LambertMaterial':
      return new LambertMaterial({ color, opacity: def.opacity, transparent: def.transparent });
    case 'StandardMaterial':
      return new StandardMaterial({ color, opacity: def.opacity, transparent: def.transparent, metalness: def.metalness, roughness: def.roughness });
    default:
      throw new Error(`OpenCrate Core: ObjectLoader — unknown material type "${String((def as { type: string }).type)}".`);
  }
}

function materialToJSON(material: Material): JSONMaterial {
  const m = material as unknown as { color?: Color; metalness?: number; roughness?: number };
  return {
    type: material.type as JSONMaterial['type'],
    color: m.color ? [m.color.r, m.color.g, m.color.b] : undefined,
    opacity: material.opacity,
    transparent: material.transparent,
    metalness: m.metalness,
    roughness: m.roughness,
  };
}
