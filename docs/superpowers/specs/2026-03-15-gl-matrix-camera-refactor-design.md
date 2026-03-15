# gl-matrix Camera Refactor — Image Cropper Next

**Date:** 2026-03-15
**Package:** `packages/image-cropper-next`
**Status:** Design approved

## Goal

Replace hand-rolled trigonometry with `gl-matrix` and introduce a world/camera/screen coordinate system inspired by game-dev view matrices. The result is less code, clearer separation of concerns, and a single-matrix source of truth for the view transform.

## Decisions

- **Library:** `gl-matrix` — specifically `mat2d` (2D affine) and `vec2`. Flips are represented as negative scale in the 2D matrix (not 3D `rotateY`/`rotateX`). This means no flip animation — acceptable for an image cropper.
- **Approach:** Camera abstraction. A `ViewTransform` represented as a `mat2d` that encodes zoom, pan, rotation, and flip. Composed from discrete state fields on every render.
- **Public state shape:** Unchanged. `CropperState` still exposes `crop`, `zoom`, `rotation`, `flip` as individual fields. The camera matrix is an internal implementation detail — composed on-the-fly, never stored in state.
- **Freeform removal scope:** `polygon.ts`, `freeform-stencil.tsx`, and `freeform-crop.story.tsx` are deleted. The `freeform-crop` variant is removed from `TransformOperation`. `cropPoints` and `cropMode` are removed from `CropperState`. `cropPoints` and `onPointsChange` are removed from `StencilProps`. This is a breaking change to the serialization format — acceptable since the package is pre-1.0 and the freeform feature was never shipped.
- **Export:** Separate "export camera" maps crop rect to output canvas, replacing manual canvas transform chains.

## Coordinate Spaces

| Space | What lives here | Coordinates |
|-------|----------------|-------------|
| **World** | Image, crop rect | Normalized 0–1, origin top-left of image. Aspect ratio is implicit — a world point (0.5, 0.5) is the image center regardless of whether the image is 16:9 or 1:1. |
| **Camera** | View transform (zoom, pan, rotation, flip) | A `mat2d` mapping world to screen. Encodes image aspect ratio, container dimensions, and all transforms. |
| **Screen** | DOM container, mouse events, CSS | Pixels relative to container |

The camera matrix is the single transform connecting world and screen. Its inverse maps screen back to world.

## New Module: `core/camera.ts`

Stateless functions, not a class.

### Exports

| Function | Purpose |
|----------|---------|
| `createCamera(state, containerSize, imageSize)` | Compose `mat2d` from crop, zoom, rotation, flip, container fit, and image dimensions. The matrix maps normalized world coords to screen pixels. Recomputed on every render and on container resize. |
| `createExportCamera(state, outputSize)` | Compose `mat2d` mapping world coords to output canvas pixels. Same transform logic as `createCamera` but targeting export dimensions instead of container. |
| `worldToScreen(camera, point)` | Transform normalized point to screen pixels via `vec2.transformMat2d` |
| `screenToWorld(camera, point)` | Transform screen pixels to normalized point via inverse camera |
| `worldToScreenRect(camera, rect)` | Transform normalized rect corners, return axis-aligned bounding box in screen pixels |
| `cropRectToScreenBounds(camera, cropRect)` | Transform crop rect through camera to get pixel bounds for stencil/overlay positioning. Replaces `cropRectToVisualBounds` from `coordinates.ts`. |
| `getVisibleBounds(camera)` | Transform image corners (0,0), (1,0), (1,1), (0,1) through camera, return axis-aligned bounding box. Replaces `getRotatedBoundingBox`. |
| `restrictPanZoom(state, containerSize, imageSize, cropRect)` | Given current state fields, container/image dimensions, and crop rect, compute corrected `{ crop, zoom }` that ensure image covers crop rect. `imageSize` is the natural image dimensions (needed to derive aspect ratio for `getMinZoomForCover` and to build the camera internally). Works in state-field space (not camera space) using gl-matrix internally for the projection math. |
| `getMinZoomForCover(rotation, imageAspectRatio, cropRect)` | Minimum zoom for rotated image to cover crop rect. Takes image aspect ratio explicitly since crop rect is in normalized world space. |
| `clampNormalized(value)` | Utility: clamp a value to [0, 1]. Migrated from `coordinates.ts`. |

### Camera Composition

`createCamera` builds the matrix in this order (matching the current CSS transform chain in `use-transform-style.ts`):

```
Steps are listed in matrix multiplication order (left-to-right). Step 1 is the
outermost/last-applied-to-point transform; step 8 is the innermost/first-applied-to-point.
This matches CSS transform list reading order (left = applied last to the point).

Step 1: Start with identity
Step 2: Translate to container center (container fit)
Step 3: Translate by pan offset (scaled by rendered image size)
Step 4: Rotate by rotation angle
Step 5: Scale by (-1, 1) if horizontal flip, (1, -1) if vertical flip
Step 6: Scale by zoom factor
Step 7: Scale by image-to-container fit ratio
Step 8: Translate by (-0.5, -0.5) to center the image origin
```

This matches the existing `translate → rotateZ → rotateY → rotateX → scale` CSS chain where rotateY/rotateX become negative scales and the implicit centering is made explicit. The composition order will be verified against the current visual output during implementation.

**gl-matrix `mat2d` layout note:** `mat2d` uses column-major order: `[a, b, c, d, tx, ty]`. This maps directly to Canvas2D's `ctx.setTransform(a, b, c, d, tx, ty)`. Implementers must not transpose.

### Restriction Algorithm

`restrictPanZoom(state, containerSize, imageSize, cropRect)` works in state-field space, not camera space, to avoid decomposition complexity:

1. Build a camera matrix from current state
2. Transform crop rect corners through the inverse camera to get world-space positions
3. Find how far each corner lies outside [0, 1] x [0, 1]
4. Compute the minimal pan offset correction in world space
5. Convert world-space correction back to pan-field correction by dividing by zoom (pan is pre-zoom in the transform chain, so a world-space delta of `d` requires a pan delta of `d / zoom`)
6. If no pan correction suffices (zoom too low), compute minimum zoom via `getMinZoomForCover`
7. Return corrected `{ crop, zoom }` as state field values

This avoids general matrix decomposition. The key insight is that the pan field has a known, simple relationship to world-space translation given fixed zoom/rotation/flip.

## File-by-File Changes

### Core Layer

| Current file | Action |
|---|---|
| `core/camera.ts` | **New.** Central camera module (see above) |
| `core/math/coordinates.ts` | **Removed.** Replaced by camera functions. `clampNormalized` moves to `camera.ts`. |
| `core/math/rotation.ts` | **Shrinks.** Keep `normalizeRotation`, `degreesToRadians`, and `radiansToDegrees`. Remove `getRotatedBoundingBox` (replaced by `getVisibleBounds`). |
| `core/math/restriction.ts` | **Removed.** Replaced by `restrictPanZoom` and `getMinZoomForCover` in `camera.ts` |
| `core/math/polygon.ts` | **Removed.** Deferred from MVP |
| `core/transforms/pipeline.ts` | Remove `freeform-crop` operation variant and polygon import. Remove `cropMode` handling. |
| `core/export/canvas-renderer.ts` | Use `createExportCamera`. Replace manual transform chain with `ctx.setTransform(a, b, c, d, tx, ty)` from mat2d. Remove `renderPolygonToCanvas`, `renderTransformedImage` (only used by polygon path), and the freeform branch in `exportCroppedImage`. |
| `core/types.ts` | Remove `freeform-crop` from `TransformOperation` union. Remove `cropPoints` and `cropMode` from `CropperState`. Remove `cropPoints` and `onPointsChange` from `StencilProps`. Remove `SET_CROP_POINTS` and `SET_CROP_MODE` from `CropperAction`. Add `Camera` type alias for `mat2d`. |
| `core/constants.ts` | Remove `cropMode` and `cropPoints` from `DEFAULT_STATE` |

### Hooks

| Hook | Changes |
|---|---|
| `use-cropper-state.ts` | `enforceContainment` calls `restrictPanZoom`. Remove freeform/polygon references. Remove `SET_CROP_POINTS`/`SET_CROP_MODE` action handlers, `setCropMode`/`setCropPoints` action creators. Remove duplicate `getVisualAspectRatio` helper (camera handles this). Update `isStateDirty` to remove `cropPoints`/`cropMode` comparisons. |
| `use-interaction.ts` | Pan/zoom deltas computed via `screenToWorld`. Remove manual trig. Remove duplicate `getVisualAspectRatio` helper. |
| `use-container-fit.ts` | `getImageStyle` uses `getVisibleBounds` instead of manual rotated bounding box calc |
| `use-transform-style.ts` | Output CSS `matrix(a, b, c, d, tx, ty)` derived from the camera mat2d. Flips become negative scale components in the matrix rather than `rotateY(180deg)` / `rotateX(180deg)`. No visual difference for static rendering (only affects animated flip transitions, which we don't have). |

### Components

| Component | Changes |
|---|---|
| `cropper.tsx` | Remove freeform stencil import. Use camera for coordinate math. |
| `freeform-stencil.tsx` | **Removed** |
| `rectangle-stencil.tsx` | No change (works in normalized coords already) |
| `dimming-overlay.tsx` | No change |
| `grid-overlay.tsx` | No change |

### Stories

| Story | Changes |
|---|---|
| `freeform-crop.story.tsx` | **Removed** |
| `rectangle-crop.story.tsx` | No change |

### Tests

All existing tests for removed modules are deleted. New tests cover `camera.ts` functions. Tests for `pipeline.ts`, `use-cropper-state.ts`, and `use-interaction.ts` are updated to reflect the removed freeform operations and new camera-based restriction.

## Export Camera

The interactive camera maps world to screen (DOM container). The export camera maps world to output canvas.

`createExportCamera(state, outputSize)` builds a mat2d that maps the crop rect region of world space to fill the output canvas dimensions. Same composition logic as `createCamera`, different target viewport.

Canvas rendering becomes:
1. Create export camera from state + output dimensions
2. Call `ctx.setTransform(a, b, c, d, tx, ty)` with the mat2d values (column-major: indices 0-5 map directly)
3. Draw the full source image at its natural dimensions
4. The matrix handles all cropping, rotation, flip, and scaling

## Keyboard Accessibility (Future — Out of Scope)

Not part of this refactor. Tracked separately. The camera abstraction will make it easier to implement later since `screenToWorld` provides trivial coordinate conversion for keyboard increments.

## AI Agent Interface

The pipeline JSON layer removes the `freeform-crop` operation type. The remaining operations are unchanged:

```json
[
  { "type": "crop", "rect": { "x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8 } },
  { "type": "rotate", "degrees": 90 },
  { "type": "zoom", "factor": 1.5 },
  { "type": "flip", "direction": "horizontal" }
]
```

`stateFromPipeline()` replays operations into `CropperState`. The camera is never exposed to agents.

## Summary

- **Add:** `gl-matrix` dependency, `core/camera.ts`, `createExportCamera`
- **Remove:** `coordinates.ts`, `restriction.ts`, `polygon.ts`, `freeform-stencil.tsx`, `freeform-crop.story.tsx`, freeform types/fields
- **Shrink:** `rotation.ts`, `canvas-renderer.ts`, `use-interaction.ts`, `use-cropper-state.ts`, `use-transform-style.ts`
- **Breaking changes:** `freeform-crop` removed from `TransformOperation`, `cropPoints`/`cropMode` removed from `CropperState`, `cropPoints`/`onPointsChange` removed from `StencilProps`. Acceptable for pre-1.0 package.
- **Net effect:** Less code, one source of truth for view transforms, cleaner coordinate space separation
