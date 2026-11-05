# Contributing

## Setup

```bash
git clone https://github.com/opencrate/opencrate-core.git
cd opencrate-core
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server, opens `examples/index.html` |
| `npm run build` | Produces the tree-shakeable ESM bundle in `dist/` |
| `npm run build:size` | Builds, then prints the gzipped bundle size |
| `npm run typecheck` | `tsc --noEmit`, strict mode |
| `npm run test:math` | Runs `src/math/math.test.ts` via `tsx` |

Run `npm run typecheck` and `npm run test:math` before opening a PR — both are fast and both
are what CI checks.

## Project layout

See the table in [README.md](../README.md#project-layout). One module = one directory under
`src/`, each with its own `index.ts` barrel; the root `src/index.ts` re-exports every
module's barrel.

## Coding conventions

These aren't arbitrary — they're the constraints the rest of the codebase relies on. Patches
that break them will need to be reworked.

- **Every source file starts with:**
  ```ts
  // OpenCrate Core — 3D engine core
  // SPDX-License-Identifier: MIT
  ```
- **No `any` in public signatures.** Strict TypeScript throughout; `tsc --noEmit` must pass
  clean. Internal casts (`as unknown as X`) are acceptable where a dynamic GL/DOM API leaves
  no better option, but keep them out of exported function signatures.
- **Math methods mutate `this` and return `this`.** Don't add a math method that returns a
  new instance — add `.clone()` first if the caller needs a copy, then mutate the clone.
- **No allocation in the render hot path.** `WebGLDevice.render()`, `RenderList.gather()`,
  and anything they call per-object should reuse scratch instances (module-level or
  class-static), not `new` a `Vec3`/`Mat4`/etc. per call. If you add a per-frame computation,
  add its scratch variable as a private class field or module-level const, not a local.
- **No hidden global state, no global singletons.** A `Renderer`/`WebGLDevice` owns its own
  GL state cache; don't reach for a module-level mutable variable to share state between
  devices or scenes.
- **Materials own their GLSL as template literals**, with `#define` injection for feature
  flags (see any existing material for the pattern). No external `.glsl` files in v1 — see
  [architecture.md](./architecture.md) if you want to revisit that.
- **Geometries/materials are referenced, not copied, when passed to `Mesh`/`Line`/`Points`.**
  Don't add implicit cloning; keep `.clone()` explicit.
- **Errors vs. warnings:** throw on programmer error (a bad uniform type, a singular matrix
  inversion, a missing required attribute); use `console.warn` for recoverable issues.
- **Every class that owns GPU resources has a `dispose()`** that releases them and is safe to
  call more than once.

## Adding a new primitive geometry

1. Create `src/geometry/YourGeometry.ts`, extending `BufferGeometry`, following the pattern
   in `BoxGeometry.ts`/`SphereGeometry.ts` (compute `position`/`normal`/`uv` arrays, call
   `setAttribute`, `setIndex`, `computeBoundingSphere()`).
2. Stash the constructor args in a `readonly params: number[]` field — `ObjectLoader` relies
   on this for JSON round-tripping (see `geometryToJSON()` in `src/loaders/ObjectLoader.ts`).
3. Export it from `src/geometry/index.ts`.
4. If you want it to round-trip through `ObjectLoader`, add a case to both `buildGeometry()`
   and `geometryToJSON()` in `src/loaders/ObjectLoader.ts`.
5. Add a doc entry to [`docs/api/geometry.md`](./api/geometry.md).

## Adding a new material

1. Create `src/material/YourMaterial.ts`, extending `Material`, with `vertexShader` and
   `fragmentShader` as `#version 300 es` template literals using the fixed attribute
   locations (`position=0, normal=1, uv=2, color=3`).
2. Use `this.setDefine(key, value)` for any feature flags, so the program cache
   (`WebGLDevice`'s `(material.type, definesKey)` key) picks up the right variant.
3. Export it from `src/material/index.ts`.
4. Add a doc entry to [`docs/api/materials.md`](./api/materials.md).

## Reporting limitations vs. filing bugs

If something in [`docs/architecture.md`](./architecture.md#known-limitations-v1) is the
reason a thing doesn't work, that's expected v1 scope — open an issue to discuss the design
before sending a large PR. If something contradicts its own documentation or throws
somewhere it shouldn't, that's a bug — PRs welcome, with `npm run typecheck` and
`npm run test:math` passing.
