# `lights`

All lights extend `Object3D` — add them to the scene graph like any other object. Light
contributions are gathered fresh each frame by `WebGLDevice.render()`; you don't need to do
anything beyond `scene.add(light)`.

## `AmbientLight`

```ts
new AmbientLight(color = new Color(1, 1, 1), intensity = 0.2)
```

Uniform term applied to every surface regardless of orientation or distance. Multiple
`AmbientLight`s in a scene are summed, along with `Scene.ambient`.

## `DirectionalLight`

```ts
new DirectionalLight(color = new Color(1, 1, 1), intensity = 1)
```

Parallel-ray light (sunlight). Direction is derived from this light's **world position**
pointing at `.target` (a plain `Vec3`, default the world origin) — set `.position` to aim it,
not a direction vector directly:

```ts
sun.position.set(5, 8, 3); // "the light is over there"
sun.target.set(0, 0, 0);   // "...pointing at this"
```

`.getDirection(out: Vec3)` returns the world-space direction from the light toward `.target`,
normalized. Only the first `DirectionalLight` found in the scene graph contributes — v1
supports one directional light per render.

## `PointLight`

```ts
new PointLight(color = new Color(1, 1, 1), intensity = 1, range = 0)
```

Omnidirectional, inverse-square falloff from `.position`. `.range` is the distance at which
the contribution is fully attenuated to zero; `0` means no hard cutoff (falloff continues
indefinitely, just getting dimmer). Up to `MAX_POINT_LIGHTS` (4, exported from
`'@opencrate/core'` alongside `StandardMaterial`) point lights contribute per
`StandardMaterial` surface; extras beyond the first 4 found in the scene graph are ignored.
`LambertMaterial` and `BasicMaterial` don't read point lights at all.

## `SpotLight`

```ts
new SpotLight(color = new Color(1, 1, 1), intensity = 1, range = 0, angle = Math.PI / 6, penumbra = 0.1)
```

Cone-shaped light aimed from `.position` at `.target`, with `.angle` (outer cone half-angle,
radians) and `.penumbra` (0–1 fraction of `.angle` where falloff begins; `1` = hard edge).
`.getDirection(out: Vec3)` works the same as on `DirectionalLight`.

> **Not yet sampled by any shader.** `SpotLight` is fully modeled on the object side but
> `WebGLDevice` doesn't currently pass spot-light uniforms to any built-in material — see
> [architecture.md](../architecture.md#known-limitations-v1). It's present for downstream
> materials/packages to read directly.
