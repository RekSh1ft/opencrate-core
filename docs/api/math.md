# `math`

Mutable math types. **Every instance method mutates `this` and returns `this`** (chaining
convention) — use `.clone()` when you need an independent copy. There is no immutable
variant; this is deliberate (see [architecture.md](../architecture.md#mutate-and-chain-math)).

## `Vec3`

```ts
new Vec3(x = 0, y = 0, z = 0)
```

| Method | Notes |
|---|---|
| `.set(x, y, z)` / `.setScalar(s)` / `.copy(v)` / `.clone()` | |
| `.add(v)` / `.addScalar(s)` / `.addVectors(a, b)` / `.addScaledVector(v, s)` | |
| `.sub(v)` / `.subVectors(a, b)` | |
| `.multiply(v)` / `.scale(s)` / `.divideScalar(s)` / `.negate()` | |
| `.dot(v)` / `.cross(v)` / `.crossVectors(a, b)` | |
| `.length()` / `.lengthSq()` / `.normalize()` / `.setLength(len)` | |
| `.lerp(v, t)` / `.lerpVectors(a, b, t)` | |
| `.distanceTo(v)` / `.distanceToSquared(v)` | |
| `.min(v)` / `.max(v)` | component-wise |
| `.applyMat4(m)` | full 4x4 transform (homogeneous divide) |
| `.transformDirection(m)` | upper-left 3x3 only, then normalizes — for directions/normals under uniform scale |
| `.applyQuat(q)` | |
| `.equals(v, eps?)` | |
| `.toArray(out?, offset?)` / `.fromArray(arr, offset?)` | |

Static constants: `Vec3.ZERO`, `Vec3.ONE`, `Vec3.UP`, `Vec3.FORWARD` (all `Readonly<Vec3>` —
don't mutate them).

## `Vec2` / `Vec4`

Same shape as `Vec3`, scoped to 2 or 4 components: `set/copy/clone/add/sub/scale/dot/
lengthSq/length/normalize/lerp/equals/toArray`. `Vec4` defaults `w = 1`.

## `Mat4`

```ts
new Mat4() // identity
```

Column-major, backed by a `Float32Array` at `.elements` (matches WebGL's native layout —
pass `.elements` straight into `gl.uniformMatrix4fv`).

| Method | Notes |
|---|---|
| `.identity()` / `.set(...16 values, row-major args)` / `.copy(m)` / `.clone()` | |
| `.multiply(m)` | `this = this * m` |
| `.premultiply(m)` | `this = m * this` |
| `.multiplyMatrices(a, b)` | `this = a * b`; safe even if `a`/`b` alias `this` |
| `.determinant()` | |
| `.invert()` | **throws** if the matrix is singular (programmer error, not a recoverable warning) |
| `.transpose()` | |
| `.makeTranslation(x, y, z)` / `.makeScale(x, y, z)` / `.makeRotationFromQuat(q)` | overwrite as pure transform |
| `.compose(position, quat, scale)` | TRS, no allocation |
| `.decompose(position, quat, scale)` | inverse of `compose`; mutates the three args |
| `.makePerspective(fovYRad, aspect, near, far)` | right-handed, WebGL `[-1, 1]` clip-space Z |
| `.makeOrthographic(left, right, top, bottom, near, far)` | |
| `.lookAt(eye, target, up)` | builds a basis (not a full view matrix with translation) |
| `.extractPosition(out)` | reads the translation column into `out` |
| `.toArray(out?, offset?)` / `.equals(m, eps?)` | |

## `Mat3`

```ts
new Mat3() // identity
```

Primarily used as a **normal matrix**. `.getNormalMatrix(m)` sets this to the
inverse-transpose of `m`'s upper-left 3x3 — the correct transform for normals under
non-uniform scale (what every built-in lit material's shader expects as `u_normalMatrix`).
Also has `.setFromMat4(m)` (no inverse/transpose — just extracts the 3x3), `.invert()`,
`.transpose()`, `.copy()`, `.clone()`, `.toArray()`.

## `Quat`

```ts
new Quat(x = 0, y = 0, z = 0, w = 1) // identity
```

The engine's source of truth for rotation (see
[architecture.md](../architecture.md#quaternion-first-rotation)).

| Method | Notes |
|---|---|
| `.set(x, y, z, w)` / `.copy(q)` / `.clone()` / `.identity()` | |
| `.fromEuler(e)` | reads `e.order`; supports all six `EulerOrder` values |
| `.fromMat4(m)` | extracts rotation from a matrix's upper-left 3x3 (works even if `m` carries uniform/non-uniform scale, since the engine normalizes rows during `Mat4.decompose`) |
| `.setFromAxisAngle(axisX, axisY, axisZ, angle)` | |
| `.length()` / `.lengthSq()` / `.normalize()` | |
| `.conjugate()` / `.invert()` | |
| `.dot(q)` | |
| `.multiply(q)` / `.premultiply(q)` / `.multiplyQuats(a, b)` | |
| `.slerp(q, t)` | spherical interpolation toward `q`, `t` in `[0, 1]` |
| `Quat.slerpQuats(a, b, t, out)` | static convenience, writes into `out` |
| `.equals(q, eps?)` | |

## `Euler`

```ts
new Euler(x = 0, y = 0, z = 0, order: EulerOrder = 'XYZ')
```

`type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY'`. A plain data holder
(angles in radians + an order tag) — the actual rotation math lives in `Quat.fromEuler()` and
`Mat4.compose`/`decompose`. `.set()` / `.copy()` / `.clone()` / `.equals()`.

## `Color`

```ts
new Color(r = 1, g = 1, b = 1) // linear RGB, components typically [0, 1], HDR allowed
```

`.set(r, g, b)` / `.setHex(0xff8800)` / `.copy()` / `.clone()` / `.add(c)` / `.multiply(c)` /
`.scale(s)` / `.lerp(c, t)` / `.toSRGB()` (sRGB-encodes this linear color in place) /
`.toArray(out?, offset?)`.

## `Rect`

```ts
new Rect(x = 0, y = 0, width = 0, height = 0)
```

Axis-aligned rectangle, used for viewports/scissor rects. `.set()` / `.copy()` / `.clone()` /
`.containsPoint(px, py)` / `.equals(r)`.

## `Sphere`

```ts
new Sphere(center = new Vec3(), radius = -1) // radius < 0 means "empty"
```

Bounding sphere used for frustum culling. `.set(center, radius)` / `.setFromPoints(flatArray)`
(an O(n) centroid + max-extent approximation — see
[architecture.md](../architecture.md#frustum-culling) for why it's not a minimal enclosing
sphere) / `.copy()` / `.clone()` / `.isEmpty()`.

## `Frustum`

```ts
new Frustum()
```

Six-plane view frustum. `.setFromViewProjectionMatrix(m)` extracts the planes (Gribb/Hartmann
method); `.intersectsSphere(sphere)` tests a `Sphere` against all six planes. You rarely
construct this directly — `Camera.getFrustum()` and `RenderList.gather()` do it for you.
