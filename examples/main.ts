// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT
//
// Demo scene: a rotating lit cube, a textured sphere, a torus, a ground plane,
// three lights (ambient + directional + point), and OrbitControls. Shows an
// FPS + draw-call overlay in the corner. Run with `npm run dev`.

import * as opc from '../src/index.js';
import {
  Scene,
  PerspectiveCamera,
  Renderer,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  TorusGeometry,
  StandardMaterial,
  LambertMaterial,
  BasicMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
  OrbitControls,
  Clock,
  Color,
  DataTexture,
} from '../src/index.js';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const fpsEl = document.getElementById('fps') as HTMLSpanElement;
const drawCallsEl = document.getElementById('drawcalls') as HTMLSpanElement;

const renderer = new Renderer(canvas, { antialias: true, devMode: true });
const scene = new Scene();
scene.background.copy(new Color(0.05, 0.07, 0.1));

const camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 3, 6);
camera.lookAt(scene.position);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectFromSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

// --- Lights ---
const ambient = new AmbientLight(new Color(1, 1, 1), 0.15);
scene.add(ambient);

const dirLight = new DirectionalLight(new Color(1, 0.96, 0.9), 1.0);
dirLight.position.set(5, 8, 3);
scene.add(dirLight);

const pointLight = new PointLight(new Color(0.4, 0.6, 1), 2.0, 12);
pointLight.position.set(-3, 2, -2);
scene.add(pointLight);

// --- Ground plane ---
const ground = new Mesh(
  new PlaneGeometry(20, 20, 1, 1),
  new LambertMaterial({ color: new Color(0.25, 0.27, 0.3) }),
);
ground.position.set(0, -1.5, 0);
ground.quaternion.setFromAxisAngle(1, 0, 0, -Math.PI / 2);
ground.markDirty();
scene.add(ground);

// --- Rotating lit cube (StandardMaterial / PBR-lite) ---
const cube = new Mesh(
  new BoxGeometry(1.2, 1.2, 1.2),
  new StandardMaterial({ color: new Color(0.9, 0.25, 0.2), metalness: 0.2, roughness: 0.4 }),
);
cube.position.set(-2, 0, 0);
scene.add(cube);

// --- Textured sphere (procedural checker DataTexture) ---
const checkerTexture = makeCheckerTexture();
const sphere = new Mesh(
  new SphereGeometry(1, 48, 24),
  new BasicMaterial({ color: new Color(1, 1, 1), map: checkerTexture }),
);
sphere.position.set(0.5, 0, 0);
scene.add(sphere);

// --- Torus (LambertMaterial) ---
const torus = new Mesh(
  new TorusGeometry(0.9, 0.3, 20, 48),
  new LambertMaterial({ color: new Color(0.3, 0.8, 0.5) }),
);
torus.position.set(3.2, 0, 0);
scene.add(torus);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);

const clock = new Clock();
clock.start();

// Scratch quaternions reused every frame — the internal `opc` alias (per the engine's example
// convention) is used here for a one-off type reference, demonstrating it alongside named imports.
const scratchSpinY: opc.Quat = new opc.Quat();
const scratchSpinX: opc.Quat = new opc.Quat();

let frames = 0;
let fpsAccum = 0;

function animate(): void {
  const dt = clock.getDelta();

  cube.quaternion.multiplyQuats(cube.quaternion, scratchSpinY.setFromAxisAngle(0, 1, 0, dt * 0.8));
  cube.markDirty();

  sphere.position.y = Math.sin(clock.getElapsed() * 1.2) * 0.3;
  sphere.markDirty();

  torus.quaternion.multiplyQuats(torus.quaternion, scratchSpinX.setFromAxisAngle(1, 0, 0, dt * 0.5));
  torus.markDirty();

  controls.update();
  renderer.render(scene, camera);

  frames++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    fpsEl.textContent = `FPS: ${Math.round(frames / fpsAccum)}`;
    drawCallsEl.textContent = `Draw calls: ${renderer.drawCallCount}`;
    frames = 0;
    fpsAccum = 0;
  }

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function makeCheckerTexture(): DataTexture {
  const size = 64;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const on = ((x >> 3) + (y >> 3)) % 2 === 0;
      const v = on ? 235 : 40;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = on ? 235 : 60;
      data[i + 3] = 255;
    }
  }
  return new DataTexture(data, size, size);
}
