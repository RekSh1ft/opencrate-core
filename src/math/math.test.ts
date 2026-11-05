// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT
//
// Plain assertion smoke tests. Run with `npm run test:math` (tsx).
// Not a full test suite — covers the arithmetic a renderer depends on being correct.

import { Mat4 } from './Mat4.js';
import { Vec3 } from './Vec3.js';
import { Quat } from './Quat.js';
import { Euler } from './Euler.js';

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean): void {
  console.assert(cond, `FAIL: ${label}`);
  if (cond) passed++; else failed++;
}

function approxEqual(a: number, b: number, eps = 1e-4): boolean {
  return Math.abs(a - b) < eps;
}

// --- Mat4 multiply identity ---
{
  const m = new Mat4().makeTranslation(1, 2, 3);
  const id = new Mat4();
  const result = new Mat4().multiplyMatrices(m, id);
  check('multiply by identity is no-op', result.equals(m));
}

// --- Mat4 invert round-trip ---
{
  const m = new Mat4().compose(
    new Vec3(1, 2, 3),
    new Quat().setFromAxisAngle(0, 1, 0, Math.PI / 3),
    new Vec3(1, 1, 1),
  );
  const inv = m.clone().invert();
  const product = new Mat4().multiplyMatrices(m, inv);
  check('M * M^-1 == identity', product.equals(new Mat4(), 1e-3));
}

// --- compose/decompose round-trip ---
{
  const pos = new Vec3(5, -2, 10);
  const rot = new Quat().setFromAxisAngle(0.267, 0.534, 0.802, 1.1); // normalized-ish axis
  rot.normalize();
  const scale = new Vec3(2, 0.5, 1.5);

  const m = new Mat4().compose(pos, rot, scale);

  const outPos = new Vec3();
  const outRot = new Quat();
  const outScale = new Vec3();
  m.decompose(outPos, outRot, outScale);

  check('decompose position matches', outPos.equals(pos, 1e-3));
  check('decompose scale matches', outScale.equals(scale, 1e-3));
  // Quaternion may decompose to the negated (equivalent) rotation.
  const dot = Math.abs(rot.dot(outRot));
  check('decompose rotation matches (up to sign)', approxEqual(dot, 1, 1e-3));
}

// --- perspective matrix sanity ---
{
  const m = new Mat4().makePerspective((60 * Math.PI) / 180, 16 / 9, 0.1, 1000);
  const e = m.elements;
  check('perspective[15] is 0 (not affine)', e[15] === 0);
  check('perspective[11] is -1', e[11] === -1);
}

// --- lookAt + Quat.fromMat4 round-trip through Euler ---
{
  const euler = new Euler(0.3, 1.1, -0.4, 'XYZ');
  const q = new Quat().fromEuler(euler);
  const m = new Mat4().makeRotationFromQuat(q);
  const q2 = new Quat().fromMat4(m);
  const dot = Math.abs(q.dot(q2));
  check('Euler -> Quat -> Mat4 -> Quat round-trip', approxEqual(dot, 1, 1e-3));
}

// --- Vec3 cross/dot sanity ---
{
  const x = new Vec3(1, 0, 0);
  const y = new Vec3(0, 1, 0);
  const z = new Vec3().crossVectors(x, y);
  check('X cross Y == Z', z.equals(new Vec3(0, 0, 1)));
  check('X dot Y == 0', x.dot(y) === 0);
}

console.log(`\nmath.test.ts: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  // eslint-disable-next-line no-undef -- Node global, fine for a CLI test script
  (globalThis as { process?: { exitCode?: number } }).process
    ? ((globalThis as unknown as { process: { exitCode: number } }).process.exitCode = 1)
    : undefined;
}
