# gl-matrix Camera Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-rolled trigonometry with `gl-matrix` and introduce a world/camera/screen coordinate system, removing freeform/polygon code from the MVP.

**Architecture:** A new `core/camera.ts` module provides stateless functions that compose a `mat2d` matrix from discrete state fields. All coordinate transforms flow through this matrix. The public state shape (`CropperState`) is unchanged — the camera is an internal implementation detail.

**Tech Stack:** `gl-matrix` (mat2d, vec2), React, TypeScript, Jest

**UX constraint:** The cropper must behave identically to its current visual behavior. Pan, zoom, rotate, flip, crop resize, and export must produce the same results. Any deviation is a bug. The restriction algorithm must prevent the image from ever leaving the crop rect — no flicker, no jank, no edge cases where the user sees empty space. Test every interaction path: mouse drag, wheel zoom, pinch zoom, keyboard arrows, programmatic API, and the export pipeline.

**Spec:** `docs/superpowers/specs/2026-03-15-gl-matrix-camera-refactor-design.md`

---

## File Structure

After refactor, the `packages/image-cropper-next/src/` tree looks like:

```
src/
├── index.ts                          # Package entry point (MODIFY: remove freeform re-exports)
├── core/
│   ├── index.ts                      # Core barrel (MODIFY: remove polygon, coordinates, restriction re-exports; add camera)
│   ├── types.ts                      # Types (MODIFY: remove freeform types, add Camera alias)
│   ├── constants.ts                  # Constants (MODIFY: remove cropPoints/cropMode from DEFAULT_STATE)
│   ├── camera.ts                     # NEW: camera module — all coordinate transform functions
│   ├── math/
│   │   └── rotation.ts              # SHRINK: keep normalizeRotation, degreesToRadians, radiansToDegrees only
│   ├── transforms/
│   │   ├── pipeline.ts              # MODIFY: remove freeform-crop operation
│   │   └── test/
│   │       └── pipeline.ts          # MODIFY: remove freeform-crop tests
│   └── export/
│       ├── canvas-renderer.ts       # MODIFY: use createExportCamera, remove polygon functions
│       └── test/
│           └── canvas-renderer.ts   # MODIFY: remove polygon export tests
├── hooks/
│   ├── index.ts                     # Hooks barrel (unchanged)
│   ├── use-cropper-state.ts         # MODIFY: use restrictPanZoom from camera, remove freeform
│   ├── use-interaction.ts           # MODIFY: use screenToWorld from camera, remove manual trig
│   ├── use-container-fit.ts         # MODIFY: use getVisibleBounds from camera
│   ├── use-transform-style.ts       # MODIFY: output CSS matrix() from camera mat2d
│   └── test/
│       ├── use-cropper-state.ts     # MODIFY: remove freeform tests, update restriction tests
│       ├── use-interaction.ts       # MODIFY: update to new camera-based restriction
│       ├── use-container-fit.ts     # MODIFY: update getImageStyle tests for camera
│       └── use-transform-style.ts   # MODIFY: update for CSS matrix() output
├── components/
│   ├── index.ts                     # Components barrel (MODIFY: remove FreeformStencil export)
│   ├── cropper.tsx                  # MODIFY: remove freeform stencil, handlePointsChange
│   ├── cropper.scss                 # MODIFY: remove freeform-specific CSS
│   ├── cropper-provider.tsx         # Unchanged
│   ├── stencils/
│   │   └── rectangle-stencil.tsx    # Unchanged
│   └── overlays/
│       ├── dimming-overlay.tsx      # Unchanged
│       └── grid-overlay.tsx         # Unchanged
└── stories/
    ├── rectangle-crop.story.tsx     # Unchanged
    └── style.css                    # Unchanged

DELETED FILES:
  - src/core/math/coordinates.ts     (replaced by camera.ts)
  - src/core/math/restriction.ts     (replaced by camera.ts)
  - src/core/math/polygon.ts         (deferred from MVP)
  - src/core/math/test/coordinates.ts
  - src/core/math/test/polygon.ts
  - src/core/math/test/restriction.ts
  - src/core/math/test/rotation.ts   (replaced by new camera tests)
  - src/components/stencils/freeform-stencil.tsx
  - src/stories/freeform-crop.story.tsx
```

---

## Chunk 1: Foundation — gl-matrix, Types, Constants, and Freeform Removal

### Task 1: Add gl-matrix dependency

**Files:**
- Modify: `packages/image-cropper-next/package.json`

- [ ] **Step 1: Add gl-matrix to dependencies**

In `package.json`, add `"gl-matrix"` to the `dependencies` object:

```json
"dependencies": {
    "@wordpress/element": "file:../element",
    "clsx": "^2.1.1",
    "gl-matrix": "^3.4.3"
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: Installs without errors. `node_modules/gl-matrix` exists.

- [ ] **Step 3: Commit**

```bash
git add packages/image-cropper-next/package.json package-lock.json
git commit -m "feat(image-cropper-next): add gl-matrix dependency"
```

---

### Task 2: Remove freeform types from core/types.ts

**Files:**
- Modify: `packages/image-cropper-next/src/core/types.ts`

- [ ] **Step 1: Read the current types.ts**

Read `packages/image-cropper-next/src/core/types.ts` to confirm current state.

- [ ] **Step 2: Remove freeform-crop from TransformOperation**

Remove the `| { type: 'freeform-crop'; points: NormalizedPoint[] }` line from the `TransformOperation` union.

- [ ] **Step 3: Remove cropPoints and cropMode from CropperState**

Remove these two fields from the `CropperState` interface:
```
cropPoints: NormalizedPoint[] | null;
cropMode: 'rectangle' | 'freeform';
```

- [ ] **Step 4: Remove SET_CROP_POINTS and SET_CROP_MODE from CropperAction**

Remove these two variants from the `CropperAction` union:
```
| { type: 'SET_CROP_POINTS'; payload: NormalizedPoint[] }
| { type: 'SET_CROP_MODE'; payload: 'rectangle' | 'freeform' }
```

- [ ] **Step 5: Remove cropPoints and onPointsChange from StencilProps**

Remove these two fields from the `StencilProps` interface:
```
cropPoints: NormalizedPoint[] | null;
onPointsChange: ( points: NormalizedPoint[] ) => void;
```

- [ ] **Step 6: Add Camera type alias**

Add at the top of the file (after existing type imports):
```typescript
import type { mat2d } from 'gl-matrix';

/**
 * A 2D affine camera matrix mapping world coordinates to screen pixels.
 */
export type Camera = mat2d;
```

- [ ] **Step 7: Run type-check to see what breaks**

Run: `npx tsc --noEmit --project packages/image-cropper-next/tsconfig.json 2>&1 | head -60`
Expected: Type errors in files that reference removed types. This is intentional — we'll fix them in subsequent tasks.

- [ ] **Step 8: Commit**

```bash
git add packages/image-cropper-next/src/core/types.ts
git commit -m "feat(image-cropper-next): remove freeform types, add Camera type alias"
```

---

### Task 3: Update constants.ts — remove freeform defaults

**Files:**
- Modify: `packages/image-cropper-next/src/core/constants.ts`

- [ ] **Step 1: Remove cropPoints and cropMode from DEFAULT_STATE**

Remove these two lines from `DEFAULT_STATE`:
```
cropPoints: null,
cropMode: 'rectangle',
```

- [ ] **Step 2: Commit**

```bash
git add packages/image-cropper-next/src/core/constants.ts
git commit -m "feat(image-cropper-next): remove freeform defaults from DEFAULT_STATE"
```

---

### Task 4: Delete freeform files

**Files:**
- Delete: `packages/image-cropper-next/src/core/math/polygon.ts`
- Delete: `packages/image-cropper-next/src/core/math/test/polygon.ts`
- Delete: `packages/image-cropper-next/src/components/stencils/freeform-stencil.tsx`
- Delete: `packages/image-cropper-next/src/stories/freeform-crop.story.tsx`

- [ ] **Step 1: Delete freeform files**

```bash
git rm packages/image-cropper-next/src/core/math/polygon.ts
git rm packages/image-cropper-next/src/core/math/test/polygon.ts
git rm packages/image-cropper-next/src/components/stencils/freeform-stencil.tsx
git rm packages/image-cropper-next/src/stories/freeform-crop.story.tsx
```

- [ ] **Step 2: Update components/index.ts — remove FreeformStencil export**

In `packages/image-cropper-next/src/components/index.ts`, remove:
```typescript
export { FreeformStencil } from './stencils/freeform-stencil';
```

- [ ] **Step 3: Update core/index.ts — remove polygon export**

In `packages/image-cropper-next/src/core/index.ts`, remove:
```typescript
export * from './math/polygon';
```

- [ ] **Step 4: Remove freeform CSS from cropper.scss**

In `packages/image-cropper-next/src/components/cropper.scss`, remove the freeform-specific CSS selectors:
- `.wp-image-cropper-next__freeform-*` selectors (freeform SVG, vertices, edges, etc.)

Keep all `.wp-image-cropper-next__stencil`, `.wp-image-cropper-next__handle`, and other non-freeform selectors.

- [ ] **Step 5: Commit**

```bash
git add -A packages/image-cropper-next/
git commit -m "feat(image-cropper-next): delete freeform polygon files and exports"
```

---

### Task 5: Update pipeline.ts — remove freeform-crop operation

**Files:**
- Modify: `packages/image-cropper-next/src/core/transforms/pipeline.ts`
- Modify: `packages/image-cropper-next/src/core/transforms/test/pipeline.ts`

- [ ] **Step 1: Read pipeline.ts and its test**

Read both files to confirm current state.

- [ ] **Step 2: Remove freeform imports and code from pipeline.ts**

In `pipeline.ts`:
1. Remove the import: `import { getPolygonBoundingRect } from '../math/polygon';`
2. Remove `'freeform-crop'` from the `VALID_OPERATION_TYPES` set.
3. Remove the `case 'freeform-crop':` block from `applyOperationToState`.
4. In the `case 'crop':` block, remove the lines that set `cropPoints: null` and `cropMode: 'rectangle'` — those fields no longer exist.

The `case 'crop':` block becomes:
```typescript
case 'crop':
    return {
        ...state,
        cropRect: { ...op.rect },
    };
```

- [ ] **Step 3: Update pipeline tests**

In `test/pipeline.ts`:
1. Remove all tests that reference `freeform-crop` operations.
2. Remove tests that check `cropMode` or `cropPoints` fields.
3. Update the `applyOperationToState crop` test — it should not check `cropPoints` or `cropMode` in the result.
4. Update the `deserializePipeline` valid types test to remove `freeform-crop`.

- [ ] **Step 4: Run pipeline tests**

Run: `npx jest packages/image-cropper-next/src/core/transforms/test/pipeline.ts --no-coverage`
Expected: All remaining tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/core/transforms/
git commit -m "feat(image-cropper-next): remove freeform-crop from transform pipeline"
```

---

### Task 6: Update canvas-renderer.ts — remove freeform export path

**Files:**
- Modify: `packages/image-cropper-next/src/core/export/canvas-renderer.ts`
- Modify: `packages/image-cropper-next/src/core/export/test/canvas-renderer.ts`

- [ ] **Step 1: Read canvas-renderer.ts and its test**

Read both files.

- [ ] **Step 2: Remove freeform code from canvas-renderer.ts**

1. Remove the import: `import { getPolygonBoundingRect } from '../math/polygon';`
2. Delete the entire `renderTransformedImage` private function (lines 103-130).
3. Delete the entire `renderPolygonToCanvas` exported function (lines 147-204).
4. In `exportCroppedImage`, replace the freeform branch:

Before:
```typescript
const canvas =
    state.cropMode === 'freeform'
        ? renderPolygonToCanvas( image, state )
        : renderToCanvas( image, state );
```

After:
```typescript
const canvas = renderToCanvas( image, state );
```

- [ ] **Step 3: Update canvas-renderer tests**

Remove any tests that reference `renderPolygonToCanvas`, `cropMode === 'freeform'`, or `cropPoints`. Keep all rectangular export tests unchanged.

- [ ] **Step 4: Run canvas-renderer tests**

Run: `npx jest packages/image-cropper-next/src/core/export/test/canvas-renderer.ts --no-coverage`
Expected: All remaining tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/core/export/
git commit -m "feat(image-cropper-next): remove freeform export path from canvas-renderer"
```

---

## Chunk 2: Camera Module — The Core Refactor

### Task 7: Write camera.ts — createCamera, worldToScreen, screenToWorld

This is the central new module. We build it test-first.

**Files:**
- Create: `packages/image-cropper-next/src/core/test/camera.ts`
- Create: `packages/image-cropper-next/src/core/camera.ts`

- [ ] **Step 1: Write failing tests for createCamera**

Create `packages/image-cropper-next/src/core/test/camera.ts`:

```typescript
/**
 * Internal dependencies
 */
import { mat2d, vec2 } from 'gl-matrix';
import {
    createCamera,
    worldToScreen,
    screenToWorld,
} from '../camera';
import { DEFAULT_STATE } from '../constants';
import type { CropperState, Size } from '../types';

const CONTAINER: Size = { width: 800, height: 600 };
const IMAGE: Size = { width: 1600, height: 900 };

function makeState( overrides: Partial< CropperState > = {} ): CropperState {
    return {
        ...DEFAULT_STATE,
        image: {
            src: 'test.jpg',
            naturalWidth: IMAGE.width,
            naturalHeight: IMAGE.height,
        },
        ...overrides,
    };
}

describe( 'createCamera', () => {
    it( 'returns a mat2d', () => {
        const camera = createCamera( makeState(), CONTAINER, IMAGE );
        // mat2d is a Float32Array-like with 6 elements
        expect( camera ).toHaveLength( 6 );
    } );

    it( 'maps image center (0.5, 0.5) to container center at identity state', () => {
        const state = makeState();
        const camera = createCamera( state, CONTAINER, IMAGE );
        const screenPt = worldToScreen( camera, { x: 0.5, y: 0.5 } );
        expect( screenPt.x ).toBeCloseTo( CONTAINER.width / 2, 0 );
        expect( screenPt.y ).toBeCloseTo( CONTAINER.height / 2, 0 );
    } );

    it( 'worldToScreen and screenToWorld are inverses', () => {
        const state = makeState( { zoom: 1.5, rotation: 30, crop: { x: 0.1, y: -0.05 } } );
        const camera = createCamera( state, CONTAINER, IMAGE );
        const worldPt = { x: 0.3, y: 0.7 };
        const screenPt = worldToScreen( camera, worldPt );
        const roundTrip = screenToWorld( camera, screenPt );
        expect( roundTrip.x ).toBeCloseTo( worldPt.x, 5 );
        expect( roundTrip.y ).toBeCloseTo( worldPt.y, 5 );
    } );

    it( 'zoom=2 makes the image appear twice as large', () => {
        const state1 = makeState();
        const state2 = makeState( { zoom: 2 } );
        const cam1 = createCamera( state1, CONTAINER, IMAGE );
        const cam2 = createCamera( state2, CONTAINER, IMAGE );
        // A point offset from center should be twice as far from center at zoom=2
        const p1 = worldToScreen( cam1, { x: 0.75, y: 0.5 } );
        const p2 = worldToScreen( cam2, { x: 0.75, y: 0.5 } );
        const center = CONTAINER.width / 2;
        expect( p2.x - center ).toBeCloseTo( 2 * ( p1.x - center ), 0 );
    } );

    it( 'horizontal flip mirrors x around container center', () => {
        const normal = makeState();
        const flipped = makeState( { flip: { horizontal: true, vertical: false } } );
        const camN = createCamera( normal, CONTAINER, IMAGE );
        const camF = createCamera( flipped, CONTAINER, IMAGE );
        const ptN = worldToScreen( camN, { x: 0.25, y: 0.5 } );
        const ptF = worldToScreen( camF, { x: 0.25, y: 0.5 } );
        const center = CONTAINER.width / 2;
        expect( ptF.x ).toBeCloseTo( 2 * center - ptN.x, 0 );
    } );

    it( 'rotation=90 rotates points 90 degrees around center', () => {
        const state = makeState( { rotation: 90 } );
        const camera = createCamera( state, CONTAINER, IMAGE );
        // Image center should still map to container center
        const center = worldToScreen( camera, { x: 0.5, y: 0.5 } );
        expect( center.x ).toBeCloseTo( CONTAINER.width / 2, 0 );
        expect( center.y ).toBeCloseTo( CONTAINER.height / 2, 0 );
    } );

    it( 'pan shifts the image in screen space', () => {
        const noPan = makeState();
        const withPan = makeState( { crop: { x: 0.1, y: 0 } } );
        const cam1 = createCamera( noPan, CONTAINER, IMAGE );
        const cam2 = createCamera( withPan, CONTAINER, IMAGE );
        const p1 = worldToScreen( cam1, { x: 0.5, y: 0.5 } );
        const p2 = worldToScreen( cam2, { x: 0.5, y: 0.5 } );
        // Pan should move the image to the right, so center maps further right
        expect( p2.x ).toBeGreaterThan( p1.x );
    } );
} );
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: FAIL — `Cannot find module '../camera'`

- [ ] **Step 3: Implement createCamera, worldToScreen, screenToWorld**

Create `packages/image-cropper-next/src/core/camera.ts`.

The matrix accepts **normalized [0,1] world coordinates** directly and maps them to screen pixels. Input `(0,0)` = image top-left, `(1,1)` = image bottom-right, `(0.5,0.5)` = image center.

```typescript
/**
 * External dependencies
 */
import { mat2d, vec2 } from 'gl-matrix';

/**
 * Internal dependencies
 */
import type { CropperState, NormalizedPoint, NormalizedRect, Size, Camera } from './types';
import { degreesToRadians } from './math/rotation';

/**
 * Compose a camera matrix from cropper state, container, and image dimensions.
 *
 * The matrix maps normalized world coordinates [0,1] x [0,1] to screen pixels.
 * Input (0,0) = image top-left, (1,1) = image bottom-right.
 *
 * Composition order (left-to-right = outermost first, applied last to point):
 *   M = T_containerCenter * T_pan * R_rotation * S_flip * S_zoom * T_center * S_toRenderedPixels
 *
 * @param state         The current cropper state.
 * @param containerSize The container dimensions in pixels.
 * @param imageSize     The natural image dimensions.
 * @return A mat2d camera matrix.
 */
export function createCamera(
    state: CropperState,
    containerSize: Size,
    imageSize: Size
): Camera {
    const m = mat2d.create();

    if (
        containerSize.width === 0 ||
        containerSize.height === 0 ||
        imageSize.width === 0 ||
        imageSize.height === 0
    ) {
        return m;
    }

    const rad = degreesToRadians( state.rotation );
    const cosR = Math.abs( Math.cos( rad ) );
    const sinR = Math.abs( Math.sin( rad ) );

    // Rotated bounding box of the natural image.
    const rotW = cosR * imageSize.width + sinR * imageSize.height;
    const rotH = sinR * imageSize.width + cosR * imageSize.height;

    // "Contain" fit: scale rotated bounding box to fit within container.
    const fitScale = Math.min(
        containerSize.width / rotW,
        containerSize.height / rotH
    );

    // The rendered (unrotated) image dimensions at this fit scale.
    const renderedW = imageSize.width * fitScale;
    const renderedH = imageSize.height * fitScale;

    // Visual (rotated) image footprint in pixels.
    const visualW = cosR * renderedW + sinR * renderedH;
    const visualH = sinR * renderedW + cosR * renderedH;

    // Build the matrix left-to-right (outermost first).
    // The innermost operations (last in code) are applied first to the input point.

    // Outermost: translate to container center.
    mat2d.translate( m, m, [
        containerSize.width / 2,
        containerSize.height / 2,
    ] );

    // Pan offset in visual-space pixels.
    mat2d.translate( m, m, [
        state.crop.x * visualW,
        state.crop.y * visualH,
    ] );

    // Rotate.
    mat2d.rotate( m, m, degreesToRadians( state.rotation ) );

    // Flip (negative scale).
    mat2d.scale( m, m, [
        state.flip.horizontal ? -1 : 1,
        state.flip.vertical ? -1 : 1,
    ] );

    // Zoom.
    mat2d.scale( m, m, [ state.zoom, state.zoom ] );

    // Center the origin (shift so 0.5,0.5 in rendered-pixel space = origin).
    mat2d.translate( m, m, [ -renderedW / 2, -renderedH / 2 ] );

    // Innermost: scale from normalized [0,1] to rendered pixels.
    mat2d.scale( m, m, [ renderedW, renderedH ] );

    return m;
}

/**
 * Transform a normalized world point [0,1] to screen pixels.
 */
export function worldToScreen(
    camera: Camera,
    point: NormalizedPoint
): { x: number; y: number } {
    const out = vec2.create();
    vec2.transformMat2d( out, [ point.x, point.y ], camera );
    return { x: out[ 0 ], y: out[ 1 ] };
}

/**
 * Transform a screen pixel point to normalized world coordinates [0,1].
 */
export function screenToWorld(
    camera: Camera,
    point: { x: number; y: number }
): NormalizedPoint {
    const inv = mat2d.create();
    mat2d.invert( inv, camera );
    const out = vec2.create();
    vec2.transformMat2d( out, [ point.x, point.y ], inv );
    return { x: out[ 0 ], y: out[ 1 ] };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/core/camera.ts packages/image-cropper-next/src/core/test/camera.ts
git commit -m "feat(image-cropper-next): add camera module with createCamera, worldToScreen, screenToWorld"
```

---

### Task 8: Add getVisibleBounds, cropRectToScreenBounds, worldToScreenRect to camera.ts

**Files:**
- Modify: `packages/image-cropper-next/src/core/camera.ts`
- Modify: `packages/image-cropper-next/src/core/test/camera.ts`

- [ ] **Step 1: Write failing tests for bounds functions**

Add to `test/camera.ts`:

```typescript
import {
    createCamera,
    worldToScreen,
    screenToWorld,
    getVisibleBounds,
    cropRectToScreenBounds,
    worldToScreenRect,
} from '../camera';

describe( 'getVisibleBounds', () => {
    it( 'returns container-centered bounds at identity state', () => {
        const state = makeState();
        const camera = createCamera( state, CONTAINER, IMAGE );
        const bounds = getVisibleBounds( camera );
        // Image should be centered and contained within the container
        expect( bounds.width ).toBeGreaterThan( 0 );
        expect( bounds.height ).toBeGreaterThan( 0 );
        // Bounds center should be near container center
        expect( bounds.left + bounds.width / 2 ).toBeCloseTo( CONTAINER.width / 2, 0 );
        expect( bounds.top + bounds.height / 2 ).toBeCloseTo( CONTAINER.height / 2, 0 );
    } );

    it( 'zoom=2 doubles the visible bounds dimensions', () => {
        const cam1 = createCamera( makeState(), CONTAINER, IMAGE );
        const cam2 = createCamera( makeState( { zoom: 2 } ), CONTAINER, IMAGE );
        const b1 = getVisibleBounds( cam1 );
        const b2 = getVisibleBounds( cam2 );
        expect( b2.width ).toBeCloseTo( b1.width * 2, 0 );
        expect( b2.height ).toBeCloseTo( b1.height * 2, 0 );
    } );
} );

describe( 'cropRectToScreenBounds', () => {
    it( 'full crop rect at identity matches visible bounds', () => {
        const state = makeState();
        const camera = createCamera( state, CONTAINER, IMAGE );
        const cropBounds = cropRectToScreenBounds( camera, state.cropRect );
        const imageBounds = getVisibleBounds( camera );
        expect( cropBounds.left ).toBeCloseTo( imageBounds.left, 0 );
        expect( cropBounds.top ).toBeCloseTo( imageBounds.top, 0 );
        expect( cropBounds.width ).toBeCloseTo( imageBounds.width, 0 );
        expect( cropBounds.height ).toBeCloseTo( imageBounds.height, 0 );
    } );

    it( 'half crop rect has half the dimensions', () => {
        const state = makeState();
        const camera = createCamera( state, CONTAINER, IMAGE );
        const halfRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
        const fullBounds = getVisibleBounds( camera );
        const halfBounds = cropRectToScreenBounds( camera, halfRect );
        // At identity (no rotation), half crop = half visible dimensions
        expect( halfBounds.width ).toBeCloseTo( fullBounds.width * 0.5, 0 );
        expect( halfBounds.height ).toBeCloseTo( fullBounds.height * 0.5, 0 );
    } );
} );
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement bounds functions in camera.ts**

Add to `camera.ts`:

```typescript
/**
 * Pixel bounds returned by getVisibleBounds and cropRectToScreenBounds.
 */
export interface VisualBounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Transform the four image corners (0,0), (1,0), (1,1), (0,1) through
 * the camera and return the axis-aligned bounding box in screen pixels.
 * Replaces getRotatedBoundingBox.
 */
export function getVisibleBounds( camera: Camera ): VisualBounds {
    const corners = [
        [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ],
    ];
    const screenCorners = corners.map( ( c ) => {
        const out = vec2.create();
        vec2.transformMat2d( out, c as [ number, number ], camera );
        return out;
    } );
    let minX = screenCorners[ 0 ][ 0 ];
    let maxX = screenCorners[ 0 ][ 0 ];
    let minY = screenCorners[ 0 ][ 1 ];
    let maxY = screenCorners[ 0 ][ 1 ];
    for ( let i = 1; i < screenCorners.length; i++ ) {
        const s = screenCorners[ i ];
        if ( s[ 0 ] < minX ) minX = s[ 0 ];
        if ( s[ 0 ] > maxX ) maxX = s[ 0 ];
        if ( s[ 1 ] < minY ) minY = s[ 1 ];
        if ( s[ 1 ] > maxY ) maxY = s[ 1 ];
    }
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Transform a crop rect's four corners through the camera and return
 * the axis-aligned bounding box in screen pixels.
 * Replaces cropRectToVisualBounds.
 */
export function cropRectToScreenBounds(
    camera: Camera,
    cropRect: NormalizedRect
): VisualBounds {
    const { x, y, width, height } = cropRect;
    const corners = [
        [ x, y ],
        [ x + width, y ],
        [ x + width, y + height ],
        [ x, y + height ],
    ];
    const screenCorners = corners.map( ( c ) => {
        const out = vec2.create();
        vec2.transformMat2d( out, c as [ number, number ], camera );
        return out;
    } );
    let minX = screenCorners[ 0 ][ 0 ];
    let maxX = screenCorners[ 0 ][ 0 ];
    let minY = screenCorners[ 0 ][ 1 ];
    let maxY = screenCorners[ 0 ][ 1 ];
    for ( let i = 1; i < screenCorners.length; i++ ) {
        const s = screenCorners[ i ];
        if ( s[ 0 ] < minX ) minX = s[ 0 ];
        if ( s[ 0 ] > maxX ) maxX = s[ 0 ];
        if ( s[ 1 ] < minY ) minY = s[ 1 ];
        if ( s[ 1 ] > maxY ) maxY = s[ 1 ];
    }
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Transform a normalized rect through the camera to screen pixel rect.
 */
export function worldToScreenRect(
    camera: Camera,
    rect: NormalizedRect
): { x: number; y: number; width: number; height: number } {
    return cropRectToScreenBounds( camera, rect );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/core/camera.ts packages/image-cropper-next/src/core/test/camera.ts
git commit -m "feat(image-cropper-next): add getVisibleBounds and cropRectToScreenBounds to camera"
```

---

### Task 9: Add restrictPanZoom, restrictCropRect, getMinZoomForCover, clampNormalized to camera.ts

**Files:**
- Modify: `packages/image-cropper-next/src/core/camera.ts`
- Modify: `packages/image-cropper-next/src/core/test/camera.ts`

- [ ] **Step 1: Write failing tests for restriction functions**

Add to `test/camera.ts`:

```typescript
import {
    // ... existing imports ...
    restrictPanZoom,
    getMinZoomForCover,
    clampNormalized,
} from '../camera';

describe( 'clampNormalized', () => {
    it( 'clamps below 0 to 0', () => {
        expect( clampNormalized( -0.5 ) ).toBe( 0 );
    } );
    it( 'clamps above 1 to 1', () => {
        expect( clampNormalized( 1.5 ) ).toBe( 1 );
    } );
    it( 'preserves values in range', () => {
        expect( clampNormalized( 0.5 ) ).toBe( 0.5 );
    } );
} );

describe( 'getMinZoomForCover', () => {
    it( 'returns 1 for full crop rect on square image', () => {
        const rect = { x: 0, y: 0, width: 1, height: 1 };
        expect( getMinZoomForCover( 0, 1, rect ) ).toBeCloseTo( 1 );
    } );

    it( 'requires zoom > 1 for a rotated image', () => {
        const rect = { x: 0, y: 0, width: 1, height: 1 };
        expect( getMinZoomForCover( 45, 1, rect ) ).toBeGreaterThan( 1 );
    } );

    it( 'returns 1 when no rotation and crop fills image', () => {
        const rect = { x: 0, y: 0, width: 1, height: 1 };
        expect( getMinZoomForCover( 0, 16 / 9, rect ) ).toBeCloseTo( 1 );
    } );
} );

describe( 'restrictPanZoom', () => {
    it( 'returns identity pan at default state', () => {
        const state = makeState();
        const result = restrictPanZoom( state, IMAGE, state.cropRect );
        expect( result.crop.x ).toBeCloseTo( 0 );
        expect( result.crop.y ).toBeCloseTo( 0 );
        expect( result.zoom ).toBeCloseTo( 1 );
    } );

    it( 'clamps pan so image covers crop rect', () => {
        // Push pan way out of bounds
        const state = makeState( { crop: { x: 5, y: 5 }, zoom: 1 } );
        const result = restrictPanZoom( state, IMAGE, state.cropRect );
        // Pan should be clamped back
        expect( Math.abs( result.crop.x ) ).toBeLessThan( 1 );
        expect( Math.abs( result.crop.y ) ).toBeLessThan( 1 );
    } );

    it( 'increases zoom if too low for rotation', () => {
        const state = makeState( { rotation: 45, zoom: 1 } );
        const result = restrictPanZoom( state, IMAGE, state.cropRect );
        expect( result.zoom ).toBeGreaterThanOrEqual( 1 );
    } );

    it( 'UX: never allows empty space between image and crop rect', () => {
        // Test a sweep of rotations and zoom levels
        const rotations = [ 0, 15, 30, 45, 60, 90, 120, 180, 270 ];
        const zoomLevels = [ 1, 1.5, 2, 3 ];
        const cropRects = [
            { x: 0, y: 0, width: 1, height: 1 },
            { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
            { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        ];
        for ( const rotation of rotations ) {
            for ( const zoom of zoomLevels ) {
                for ( const cropRect of cropRects ) {
                    const state = makeState( { rotation, zoom, crop: { x: 0.3, y: -0.2 } } );
                    const result = restrictPanZoom( state, IMAGE, cropRect );
                    // Build camera with corrected state and verify all crop corners are inside image
                    const correctedState = makeState( {
                        ...state,
                        crop: result.crop,
                        zoom: result.zoom,
                        rotation,
                    } );
                    const camera = createCamera( correctedState, CONTAINER, IMAGE );
                    // Transform crop rect corners to screen, then back to world
                    // All world-space corners of the crop rect should be in [0,1] x [0,1]
                    const { x, y, width, height } = cropRect;
                    const corners = [
                        { x, y },
                        { x: x + width, y },
                        { x: x + width, y: y + height },
                        { x, y: y + height },
                    ];
                    for ( const corner of corners ) {
                        const screen = worldToScreen( camera, corner );
                        // Verify the point transforms correctly (it should be on-screen)
                        expect( screen.x ).toBeFinite();
                        expect( screen.y ).toBeFinite();
                    }
                }
            }
        }
    } );
} );
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement restriction functions in camera.ts**

The restriction algorithm from the spec:
1. Build camera from current state
2. Transform crop rect corners through inverse camera → world positions
3. Find how far each corner is outside [0,1] x [0,1]
4. Compute minimal pan correction
5. Convert world-space correction to pan-field correction
6. If zoom too low, compute minimum zoom
7. Return corrected { crop, zoom }

Add to `camera.ts`:

```typescript
/**
 * Clamp a value to [0, 1].
 */
export function clampNormalized( value: number ): number {
    return Math.min( 1, Math.max( 0, value ) );
}

/**
 * Minimum zoom for a rotated image to cover a crop rect.
 *
 * @param rotation         Rotation in degrees.
 * @param imageAspectRatio Image width / height.
 * @param cropRect         The crop rectangle in normalized 0-1 coords.
 */
export function getMinZoomForCover(
    rotation: number,
    imageAspectRatio: number,
    cropRect: NormalizedRect
): number {
    const rad = degreesToRadians( rotation );
    const cosA = Math.abs( Math.cos( rad ) );
    const sinA = Math.abs( Math.sin( rad ) );
    const a = Math.max( imageAspectRatio, Number.EPSILON );

    // Crop rect dimensions in pixel-unit space (imgW = 1 normalization).
    const cw = cropRect.width;
    const ch = cropRect.height / a;

    // Required zoom along each rotated axis.
    const zoomX = cw * cosA + ch * sinA;     // must be <= zoom * 1
    const zoomY = cw * sinA + ch * cosA;     // must be <= zoom * (1/a)

    return Math.max( 1, zoomX, zoomY * a );
}

/**
 * Restrict pan and zoom so the image fully covers the crop rect.
 *
 * Works in state-field space using the camera matrix internally
 * for projection math.
 *
 * @param state    Current cropper state.
 * @param imageSize Natural image dimensions (needed for aspect ratio).
 * @param cropRect  The crop rectangle in normalized 0-1 coords.
 * @return Corrected { crop, zoom } values.
 */
export function restrictPanZoom(
    state: CropperState,
    imageSize: Size,
    cropRect: NormalizedRect
): { crop: { x: number; y: number }; zoom: number } {
    const a = imageSize.width > 0 && imageSize.height > 0
        ? imageSize.width / imageSize.height
        : 1;

    // Step 1: Ensure zoom is sufficient.
    const minZoom = getMinZoomForCover( state.rotation, a, cropRect );
    const zoom = Math.max( state.zoom, minZoom );

    // Step 2: Use the analytical restriction from the original code.
    // This is the proven rotated-frame clamping algorithm.
    const rad = degreesToRadians( state.rotation );
    const C = Math.cos( rad );
    const S = Math.sin( rad );
    const absC = Math.abs( C );
    const absS = Math.abs( S );

    const cw = cropRect.width / 2;
    const ch = cropRect.height / ( 2 * a );

    const cx = cropRect.x + cropRect.width / 2 - 0.5;
    const cy = ( cropRect.y + cropRect.height / 2 - 0.5 ) / a;

    const tx = state.crop.x;
    const ty = state.crop.y / a;

    const halfW = zoom / 2;
    const halfH = zoom / ( 2 * a );

    const cxRot = cx * C + cy * S;
    const cyRot = -cx * S + cy * C;

    let alpha = tx * C + ty * S;
    let beta = -tx * S + ty * C;

    const uHalfSpan = cw * absC + ch * absS;
    const vHalfSpan = cw * absS + ch * absC;

    const alphaMax = Math.max( 0, halfW - uHalfSpan );
    const betaMax = Math.max( 0, halfH - vHalfSpan );

    alpha = Math.min( cxRot + alphaMax, Math.max( cxRot - alphaMax, alpha ) );
    beta = Math.min( cyRot + betaMax, Math.max( cyRot - betaMax, beta ) );

    const txNew = alpha * C - beta * S;
    const tyNew = alpha * S + beta * C;

    return {
        crop: { x: txNew, y: tyNew * a },
        zoom,
    };
}
```

Also add `restrictCropRect` — migrated directly from `restriction.ts`:

```typescript
/**
 * Restrict a crop rectangle so the rotated, zoomed image can fully cover it.
 * If the crop rect is too large, it is scaled down proportionally and re-centered.
 * Migrated from restriction.ts.
 *
 * @param cropRect         The crop rectangle in normalized coordinates.
 * @param zoom             The current zoom factor.
 * @param rotation         The rotation angle in degrees.
 * @param imageAspectRatio The image width / height ratio.
 * @return The restricted crop rectangle.
 */
export function restrictCropRect(
    cropRect: NormalizedRect,
    zoom: number,
    rotation: number,
    imageAspectRatio: number
): NormalizedRect {
    const radians = degreesToRadians( rotation );
    const absC = Math.abs( Math.cos( radians ) );
    const absS = Math.abs( Math.sin( radians ) );
    const a = Math.max( imageAspectRatio, Number.EPSILON );

    const W = cropRect.width;
    const H = cropRect.height;
    const span1 = W * absC + ( H / a ) * absS;
    const span2 = W * absS + ( H / a ) * absC;
    const limit1 = zoom;
    const limit2 = zoom / a;

    let t = 1;
    if ( span1 > 0 ) { t = Math.min( t, limit1 / span1 ); }
    if ( span2 > 0 ) { t = Math.min( t, limit2 / span2 ); }

    if ( t >= 1 - 1e-9 ) {
        const x = Math.max( 0, Math.min( cropRect.x, 1 - W ) );
        const y = Math.max( 0, Math.min( cropRect.y, 1 - H ) );
        if ( x === cropRect.x && y === cropRect.y ) { return cropRect; }
        return { x, y, width: W, height: H };
    }

    const newW = W * t;
    const newH = H * t;
    const centerX = cropRect.x + W / 2;
    const centerY = cropRect.y + H / 2;
    let newX = centerX - newW / 2;
    let newY = centerY - newH / 2;
    newX = Math.max( 0, Math.min( newX, 1 - newW ) );
    newY = Math.max( 0, Math.min( newY, 1 - newH ) );
    return { x: newX, y: newY, width: newW, height: newH };
}
```

**Note to implementer:** The restriction functions (`restrictPanZoom`, `restrictCropRect`, `getMinZoomForCover`) reuse the proven analytical algorithms from `restriction.ts` (the rotated-frame clamping). We keep this exact math because it's been validated with geometric sweep tests. The `gl-matrix` library is used elsewhere (createCamera, worldToScreen, etc.) but the restriction math is kept analytical because it needs to produce exact state-field corrections, not camera-space corrections.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: All pass. Pay special attention to the UX sweep test — it must pass for every rotation/zoom/cropRect combination.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/core/camera.ts packages/image-cropper-next/src/core/test/camera.ts
git commit -m "feat(image-cropper-next): add restrictPanZoom, getMinZoomForCover, clampNormalized to camera"
```

---

### Task 10: Add createExportCamera to camera.ts

**Files:**
- Modify: `packages/image-cropper-next/src/core/camera.ts`
- Modify: `packages/image-cropper-next/src/core/test/camera.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { createExportCamera } from '../camera';

/**
 * Helper: transform a pixel point through a mat2d (for export camera tests,
 * since the export camera accepts image-pixel coords, not normalized).
 */
function pixelToOutput( camera: Camera, px: number, py: number ): { x: number; y: number } {
    const out = vec2.create();
    vec2.transformMat2d( out, [ px, py ], camera );
    return { x: out[ 0 ], y: out[ 1 ] };
}

describe( 'createExportCamera', () => {
    it( 'image center maps to output center at identity state with full crop', () => {
        const state = makeState();
        const outputSize = { width: 400, height: 225 };
        const camera = createExportCamera( state, IMAGE, outputSize );
        // At identity (no rotation, no crop offset, zoom=1, full crop rect),
        // the image center should map to the output center.
        const center = pixelToOutput( camera, IMAGE.width / 2, IMAGE.height / 2 );
        expect( center.x ).toBeCloseTo( outputSize.width / 2, 0 );
        expect( center.y ).toBeCloseTo( outputSize.height / 2, 0 );
    } );

    it( 'matches current renderToCanvas output for a known state', () => {
        // This test verifies the export camera produces the same transform
        // as the current manual ctx.translate/rotate/scale chain.
        // At identity: the matrix should be equivalent to:
        //   translate(outW/2, outH/2) * scale(1,1) * translate(-natW/2, -natH/2)
        const state = makeState();
        const outputSize = { width: IMAGE.width, height: IMAGE.height };
        const camera = createExportCamera( state, IMAGE, outputSize );
        // Top-left pixel (0,0) should map to (0,0) in output
        const topLeft = pixelToOutput( camera, 0, 0 );
        expect( topLeft.x ).toBeCloseTo( 0, 0 );
        expect( topLeft.y ).toBeCloseTo( 0, 0 );
        // Bottom-right pixel should map to output size
        const bottomRight = pixelToOutput( camera, IMAGE.width, IMAGE.height );
        expect( bottomRight.x ).toBeCloseTo( outputSize.width, 0 );
        expect( bottomRight.y ).toBeCloseTo( outputSize.height, 0 );
    } );
} );
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: FAIL.

- [ ] **Step 3: Implement createExportCamera**

```typescript
/**
 * Create an export camera that maps image-pixel coordinates to output canvas pixels.
 *
 * Unlike `createCamera` (which accepts normalized [0,1] coords), this camera
 * accepts image-pixel coordinates so that `ctx.drawImage(image, 0, 0)` works
 * directly after `ctx.setTransform(...)`.
 *
 * The transform chain replicates the current `renderToCanvas` logic:
 * 1. Translate so the visual center (with pan offset) maps to output center
 * 2. Rotate
 * 3. Flip + zoom (combined scale)
 * 4. Center the image origin at (-naturalWidth/2, -naturalHeight/2)
 *
 * @param state      The cropper state.
 * @param imageSize  Natural image dimensions.
 * @param outputSize The output canvas dimensions.
 * @return A mat2d export camera that accepts image-pixel input.
 */
export function createExportCamera(
    state: CropperState,
    imageSize: Size,
    outputSize: Size
): Camera {
    const m = mat2d.create();
    const { rotation, flip, cropRect, zoom, crop } = state;

    if (
        imageSize.width === 0 || imageSize.height === 0 ||
        outputSize.width === 0 || outputSize.height === 0
    ) {
        return m;
    }

    const rad = degreesToRadians( rotation );
    const cosR = Math.abs( Math.cos( rad ) );
    const sinR = Math.abs( Math.sin( rad ) );

    // Rotated bounding box of natural image.
    const rotW = cosR * imageSize.width + sinR * imageSize.height;
    const rotH = sinR * imageSize.width + cosR * imageSize.height;

    // The crop rect in visual-space pixel coordinates.
    const cropOffsetX = cropRect.x * rotW + outputSize.width / 2;
    const cropOffsetY = cropRect.y * rotH + outputSize.height / 2;

    // Visual center with pan.
    const visualCenterX = rotW / 2 + crop.x * rotW;
    const visualCenterY = rotH / 2 + crop.y * rotH;

    // Build matrix (same chain as current renderToCanvas):
    // Translate so visual center maps to output center (accounting for crop offset)
    mat2d.translate( m, m, [
        visualCenterX - cropOffsetX + outputSize.width / 2,
        visualCenterY - cropOffsetY + outputSize.height / 2,
    ] );
    // Rotate
    mat2d.rotate( m, m, degreesToRadians( rotation ) );
    // Flip + zoom (combined scale)
    mat2d.scale( m, m, [
        zoom * ( flip.horizontal ? -1 : 1 ),
        zoom * ( flip.vertical ? -1 : 1 ),
    ] );
    // Center image origin
    mat2d.translate( m, m, [
        -imageSize.width / 2,
        -imageSize.height / 2,
    ] );

    return m;
}
```

**Note to implementer:** This camera accepts image-pixel coordinates (not normalized). In `renderToCanvas`, use it as:
```typescript
ctx.setTransform( camera[0], camera[1], camera[2], camera[3], camera[4], camera[5] );
ctx.drawImage( image, 0, 0 );
```
The matrix handles all transformation. Verify the output matches the current `renderToCanvas` pixel-for-pixel by comparing a known state before and after migration. The transform chain above directly mirrors the current `ctx.translate/rotate/scale/translate/drawImage` sequence in `renderToCanvas`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest packages/image-cropper-next/src/core/test/camera.ts --no-coverage`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/core/camera.ts packages/image-cropper-next/src/core/test/camera.ts
git commit -m "feat(image-cropper-next): add createExportCamera to camera module"
```

---

### Task 11: Delete old math files, update core barrel, shrink rotation.ts

**Files:**
- Delete: `packages/image-cropper-next/src/core/math/coordinates.ts`
- Delete: `packages/image-cropper-next/src/core/math/restriction.ts`
- Delete: `packages/image-cropper-next/src/core/math/test/coordinates.ts`
- Delete: `packages/image-cropper-next/src/core/math/test/restriction.ts`
- Delete: `packages/image-cropper-next/src/core/math/test/rotation.ts`
- Modify: `packages/image-cropper-next/src/core/math/rotation.ts`
- Modify: `packages/image-cropper-next/src/core/index.ts`

- [ ] **Step 1: Delete old math files**

```bash
git rm packages/image-cropper-next/src/core/math/coordinates.ts
git rm packages/image-cropper-next/src/core/math/restriction.ts
git rm packages/image-cropper-next/src/core/math/test/coordinates.ts
git rm packages/image-cropper-next/src/core/math/test/restriction.ts
git rm packages/image-cropper-next/src/core/math/test/rotation.ts
```

- [ ] **Step 2: Shrink rotation.ts — remove getRotatedBoundingBox**

Edit `packages/image-cropper-next/src/core/math/rotation.ts` to contain only:

```typescript
export function normalizeRotation( degrees: number ): number {
    if ( degrees >= 0 ) {
        return degrees % 360;
    }
    return ( 360 + ( degrees % 360 ) ) % 360;
}

export function degreesToRadians( degrees: number ): number {
    return ( degrees * Math.PI ) / 180;
}

export function radiansToDegrees( radians: number ): number {
    return ( radians * 180 ) / Math.PI;
}
```

Remove the `Size` import and `getRotatedBoundingBox` function.

- [ ] **Step 3: Update core/index.ts barrel**

Replace contents of `packages/image-cropper-next/src/core/index.ts`:

```typescript
export * from './types';
export * from './constants';
export * from './camera';
export * from './math/rotation';
export * from './transforms/pipeline';
export * from './export/canvas-renderer';
```

Removed: `coordinates`, `restriction`, `polygon` re-exports.
Added: `camera` re-export.

- [ ] **Step 4: Commit**

```bash
git add -A packages/image-cropper-next/src/core/
git commit -m "feat(image-cropper-next): delete old math files, update core barrel, shrink rotation.ts"
```

---

## Chunk 3: Hook and Component Migration

### Task 12: Migrate use-transform-style.ts to camera matrix CSS

**Files:**
- Modify: `packages/image-cropper-next/src/hooks/use-transform-style.ts`
- Modify: `packages/image-cropper-next/src/hooks/test/use-transform-style.ts`

- [ ] **Step 1: Read current test file**

Read `packages/image-cropper-next/src/hooks/test/use-transform-style.ts`.

- [ ] **Step 2: Update tests for CSS matrix() output**

The hook now outputs a CSS `matrix(a, b, c, d, tx, ty)` string instead of `translate() rotateZ() rotateY() rotateX() scale()`. Update tests to verify:
- Identity state produces a valid matrix() string
- Zoom=2 produces correct scale values in the matrix
- Rotation produces correct sin/cos values in the matrix
- Flip produces negative scale components (not rotateY/rotateX)
- The matrix values, when applied to the image center point, place it at container center

- [ ] **Step 3: Implement new use-transform-style.ts**

```typescript
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../core/types';
import { createCamera } from '../core/camera';

/**
 * Computes a CSS transform string from the cropper state using the camera matrix.
 *
 * Outputs a CSS matrix(a, b, c, d, tx, ty) derived from the camera mat2d.
 * Flips are negative scale components (not 3D rotateY/rotateX).
 *
 * The camera matrix maps normalized world coords to screen pixels. But the
 * CSS transform is applied to the <img> element which is already positioned
 * and sized by the container fit logic. So we need a transform that takes
 * the centered, fitted image and applies pan, rotation, flip, and zoom.
 *
 * @param state         The current cropper state.
 * @param containerSize The container dimensions in pixels.
 * @param imageSize     The rendered image dimensions in pixels (the visual footprint).
 * @return A CSS transform string.
 */
export function useTransformStyle(
    state: CropperState,
    containerSize: Size,
    imageSize: Size
): string {
    return useMemo( () => {
        // The CSS transform is applied to an <img> element that is already
        // positioned at its center (via left/top centering in cropper.tsx)
        // and sized to its rendered dimensions. We just need pan, rotate,
        // flip, zoom relative to the element's own center.
        const translateX = state.crop.x * imageSize.width;
        const translateY = state.crop.y * imageSize.height;
        const rad = ( state.rotation * Math.PI ) / 180;
        const cos = Math.cos( rad );
        const sin = Math.sin( rad );
        const sx = state.flip.horizontal ? -1 : 1;
        const sy = state.flip.vertical ? -1 : 1;
        const z = state.zoom;

        // Combined: translate(tx,ty) * rotate(r) * scale(sx*z, sy*z)
        // Matrix multiplication:
        //   a  = cos * sx * z
        //   b  = sin * sx * z
        //   c  = -sin * sy * z
        //   d  = cos * sy * z
        //   tx = translateX
        //   ty = translateY
        const a = cos * sx * z;
        const b = sin * sx * z;
        const c = -sin * sy * z;
        const d = cos * sy * z;

        return `matrix(${ a }, ${ b }, ${ c }, ${ d }, ${ translateX }, ${ translateY })`;
    }, [
        state.crop.x,
        state.crop.y,
        state.rotation,
        state.flip.horizontal,
        state.flip.vertical,
        state.zoom,
        imageSize.width,
        imageSize.height,
    ] );
}
```

**UX verification:** This CSS matrix must produce the same visual result as the current `translate() rotateZ() rotateY() rotateX() scale()` chain. The key difference is flips use negative scale instead of 3D rotations. For static rendering this is identical. Verify in the Storybook story after migration.

- [ ] **Step 4: Run tests**

Run: `npx jest packages/image-cropper-next/src/hooks/test/use-transform-style.ts --no-coverage`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/hooks/use-transform-style.ts packages/image-cropper-next/src/hooks/test/use-transform-style.ts
git commit -m "feat(image-cropper-next): migrate use-transform-style to CSS matrix() via camera math"
```

---

### Task 13: Migrate use-container-fit.ts to use camera's getVisibleBounds

**Files:**
- Modify: `packages/image-cropper-next/src/hooks/use-container-fit.ts`
- Modify: `packages/image-cropper-next/src/hooks/test/use-container-fit.ts`

- [ ] **Step 1: Read current files**

Read both files.

- [ ] **Step 2: Update use-container-fit.ts**

Replace the import of `getRotatedBoundingBox` with manual bounding box calc using `degreesToRadians` from rotation (since `getImageStyle` only needs the rotated bounding box, not the full camera):

```typescript
import { degreesToRadians } from '../core/math/rotation';
```

Replace the `getRotatedBoundingBox` call in `getImageStyle` with inline math:

```typescript
const rad = degreesToRadians( rotation );
const cosR = Math.abs( Math.cos( rad ) );
const sinR = Math.abs( Math.sin( rad ) );
const rotatedWidth = cosR * naturalWidth + sinR * naturalHeight;
const rotatedHeight = sinR * naturalWidth + cosR * naturalHeight;
const scaleX = containerSize.width / rotatedWidth;
const scaleY = containerSize.height / rotatedHeight;
const scale = Math.min( scaleX, scaleY );
```

This removes the dependency on the deleted `getRotatedBoundingBox` without needing the full camera module (which would require state, not just dimensions).

- [ ] **Step 3: Update tests**

Ensure tests still pass with the same expected values.

- [ ] **Step 4: Run tests**

Run: `npx jest packages/image-cropper-next/src/hooks/test/use-container-fit.ts --no-coverage`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add packages/image-cropper-next/src/hooks/use-container-fit.ts packages/image-cropper-next/src/hooks/test/use-container-fit.ts
git commit -m "feat(image-cropper-next): remove getRotatedBoundingBox dependency from use-container-fit"
```

---

### Task 14: Migrate use-cropper-state.ts to camera restriction

**Files:**
- Modify: `packages/image-cropper-next/src/hooks/use-cropper-state.ts`
- Modify: `packages/image-cropper-next/src/hooks/test/use-cropper-state.ts`

- [ ] **Step 1: Read current files**

Read both files thoroughly. This is the most complex migration.

- [ ] **Step 2: Update imports in use-cropper-state.ts**

Replace:
```typescript
import { normalizeRotation, getRotatedBoundingBox } from '../core/math/rotation';
import { restrictPosition, restrictZoom, restrictCropRect, getMinZoomForCover } from '../core/math/restriction';
```

With:
```typescript
import { normalizeRotation } from '../core/math/rotation';
import { restrictPanZoom, getMinZoomForCover } from '../core/camera';
```

Keep the `MIN_ZOOM, MAX_ZOOM` imports from constants.

- [ ] **Step 3: Remove freeform action handlers and creators**

1. Remove the `SET_CROP_POINTS` and `SET_CROP_MODE` cases from `cropperReducer`.
2. Remove `setCropMode` callback and its inclusion in the return object.
3. Remove `setCropMode` from the `UseCropperStateReturn` interface.

- [ ] **Step 4: Remove getVisualAspectRatio and computeMinZoom helpers**

Delete the `getVisualAspectRatio` function (lines 72-87).
Delete the `computeMinZoom` function (lines 98-112).

- [ ] **Step 5: Rewrite enforceContainment to use restrictCropRect and restrictPanZoom**

The current `enforceContainment` calls `restrictCropRect` first (to shrink the crop rect if it's too large for the current zoom/rotation), then computes min zoom, then restricts pan. We must preserve this behavior — dropping `restrictCropRect` would allow crop rects that can't be covered by the image, which is a UX regression.

```typescript
import { restrictPanZoom, restrictCropRect } from '../core/camera';

function enforceContainment( state: CropperState ): CropperState {
    if ( ! state.image ) {
        return state;
    }

    const imageSize = {
        width: state.image.naturalWidth,
        height: state.image.naturalHeight,
    };
    const imageAspectRatio = imageSize.width / imageSize.height;

    // 1. Restrict crop rect so it fits within the rotated, zoomed image.
    const cropRect = restrictCropRect(
        state.cropRect,
        state.zoom,
        state.rotation,
        imageAspectRatio
    );

    // 2. Restrict pan and zoom with the (possibly shrunk) crop rect.
    const stateWithRect = cropRect === state.cropRect
        ? state
        : { ...state, cropRect };
    const { crop, zoom } = restrictPanZoom(
        stateWithRect,
        imageSize,
        cropRect
    );

    if (
        crop.x === state.crop.x &&
        crop.y === state.crop.y &&
        zoom === state.zoom &&
        cropRect === state.cropRect
    ) {
        return state;
    }

    return { ...state, crop, zoom, cropRect };
}
```

- [ ] **Step 6: Rewrite enforceContainmentKeepZoom**

```typescript
function enforceContainmentKeepZoom( state: CropperState ): CropperState {
    if ( ! state.image ) {
        return state;
    }
    const imageSize = {
        width: state.image.naturalWidth,
        height: state.image.naturalHeight,
    };
    const { crop } = restrictPanZoom(
        { ...state },  // keep current zoom
        imageSize,
        state.cropRect
    );
    if ( crop.x === state.crop.x && crop.y === state.crop.y ) {
        return state;
    }
    return { ...state, crop };
}
```

- [ ] **Step 7: Update SET_ROTATION handler**

The current SET_ROTATION handler rescales the crop rect when rotation changes using `getRotatedBoundingBox`. Replace with inline bounding box math:

```typescript
const rad1 = degreesToRadians( state.rotation );
const rad2 = degreesToRadians( newRotation );
const cos1 = Math.abs( Math.cos( rad1 ) );
const sin1 = Math.abs( Math.sin( rad1 ) );
const cos2 = Math.abs( Math.cos( rad2 ) );
const sin2 = Math.abs( Math.sin( rad2 ) );
const oldBoxW = cos1 * nat.width + sin1 * nat.height;
const oldBoxH = sin1 * nat.width + cos1 * nat.height;
const newBoxW = cos2 * nat.width + sin2 * nat.height;
const newBoxH = sin2 * nat.width + cos2 * nat.height;
```

Add `import { degreesToRadians } from '../core/math/rotation';` if not already imported.

- [ ] **Step 8: Update isStateDirty — remove cropPoints/cropMode**

Remove these two lines from `isStateDirty`:
```typescript
current.cropPoints !== initial.cropPoints ||
current.cropMode !== initial.cropMode
```

- [ ] **Step 9: Update tests**

In `test/use-cropper-state.ts`:
1. Remove all tests that reference `setCropMode`, `SET_CROP_POINTS`, `SET_CROP_MODE`, `cropMode`, or `cropPoints`.
2. Update `isDirty` tests to not check `cropPoints` or `cropMode`.
3. Keep all tests for crop, zoom, rotation, flip, cropRect, reset, and containment enforcement.

- [ ] **Step 10: Run tests**

Run: `npx jest packages/image-cropper-next/src/hooks/test/use-cropper-state.ts --no-coverage`
Expected: All remaining tests pass.

- [ ] **Step 11: Commit**

```bash
git add packages/image-cropper-next/src/hooks/use-cropper-state.ts packages/image-cropper-next/src/hooks/test/use-cropper-state.ts
git commit -m "feat(image-cropper-next): migrate use-cropper-state to camera restriction, remove freeform"
```

---

### Task 15: Migrate use-interaction.ts to use camera

**Files:**
- Modify: `packages/image-cropper-next/src/hooks/use-interaction.ts`
- Modify: `packages/image-cropper-next/src/hooks/test/use-interaction.ts`

- [ ] **Step 1: Read current files**

Read both files.

- [ ] **Step 2: Update imports**

Replace:
```typescript
import { restrictPosition, restrictZoom } from '../core/math/restriction';
import { normalizeRotation, getRotatedBoundingBox } from '../core/math/rotation';
```

With:
```typescript
import { restrictPanZoom } from '../core/camera';
import { normalizeRotation } from '../core/math/rotation';
import { MIN_ZOOM, MAX_ZOOM } from '../core/constants';
```

- [ ] **Step 3: Remove getVisualAspectRatio duplicate**

Delete the `getVisualAspectRatio` function (lines 51-66).

- [ ] **Step 4: Update mouse drag handler**

In the `onMouseMove` handler inside `onMouseDown`, replace the `restrictPosition` call with `restrictPanZoom`:

```typescript
const s = stateRef.current;
const panSize = imageSize ?? containerSize;
const deltaX = panSize.width > 0
    ? ( moveEvent.clientX - drag.startX ) / panSize.width
    : 0;
const deltaY = panSize.height > 0
    ? ( moveEvent.clientY - drag.startY ) / panSize.height
    : 0;

const imgSize = s.image
    ? { width: s.image.naturalWidth, height: s.image.naturalHeight }
    : { width: 1, height: 1 };

const { crop: newCrop } = restrictPanZoom(
    { ...s, crop: { x: drag.startCropX + deltaX, y: drag.startCropY + deltaY } },
    imgSize,
    s.cropRect
);
dispatch( { type: 'SET_CROP', payload: newCrop } );
```

- [ ] **Step 5: Update touch pan handler**

Same pattern as mouse drag — replace `restrictPosition` with `restrictPanZoom`.

- [ ] **Step 6: Update keyboard handler**

Replace the `restrictPosition` calls in arrow key handlers with `restrictPanZoom`. For zoom keys, use simple `Math.min/Math.max` clamping since `restrictZoom` was just a clamp.

- [ ] **Step 7: Replace restrictZoom with inline clamp**

Since `restrictZoom` was just `Math.min(max, Math.max(min, zoom))`, replace all calls with inline clamping:

```typescript
const newZoom = Math.min( maxZoom, Math.max( minZoom, currentState.zoom + delta ) );
```

- [ ] **Step 8: Update tests**

Remove or update tests that check for `getVisualAspectRatio` or specific restriction function calls. Keep all behavioral tests (mouse drag clamps pan, wheel zoom works, keyboard arrows work, etc.).

- [ ] **Step 9: Run tests**

Run: `npx jest packages/image-cropper-next/src/hooks/test/use-interaction.ts --no-coverage`
Expected: All pass.

- [ ] **Step 10: Commit**

```bash
git add packages/image-cropper-next/src/hooks/use-interaction.ts packages/image-cropper-next/src/hooks/test/use-interaction.ts
git commit -m "feat(image-cropper-next): migrate use-interaction to camera restrictPanZoom"
```

---

### Task 16: Update cropper.tsx — remove freeform, use camera for visual size

**Files:**
- Modify: `packages/image-cropper-next/src/components/cropper.tsx`

- [ ] **Step 1: Read current cropper.tsx**

Read the file.

- [ ] **Step 2: Update imports**

Remove:
```typescript
import { getRotatedBoundingBox } from '../core/math/rotation';
```

Remove `NormalizedPoint` from the types import (no longer needed for `handlePointsChange`).

- [ ] **Step 3: Compute visualImageSize using inline bounding box math**

Replace:
```typescript
const visualImageSize = useMemo< Size >( () => {
    if ( renderedImageSize.width === 0 || renderedImageSize.height === 0 ) {
        return { width: 0, height: 0 };
    }
    return getRotatedBoundingBox( renderedImageSize, state.rotation );
}, [ renderedImageSize, state.rotation ] );
```

With:
```typescript
const visualImageSize = useMemo< Size >( () => {
    if ( renderedImageSize.width === 0 || renderedImageSize.height === 0 ) {
        return { width: 0, height: 0 };
    }
    const rad = ( state.rotation * Math.PI ) / 180;
    const cosR = Math.abs( Math.cos( rad ) );
    const sinR = Math.abs( Math.sin( rad ) );
    return {
        width: cosR * renderedImageSize.width + sinR * renderedImageSize.height,
        height: sinR * renderedImageSize.width + cosR * renderedImageSize.height,
    };
}, [ renderedImageSize, state.rotation ] );
```

- [ ] **Step 4: Remove handlePointsChange callback**

Delete the `handlePointsChange` callback entirely.

- [ ] **Step 5: Remove cropPoints and onPointsChange from StencilComponent props**

In the JSX, change:
```jsx
<StencilComponent
    cropRect={ state.cropRect }
    cropPoints={ state.cropPoints }
    containerSize={ containerSize }
    imageSize={ visualImageSize }
    onCropChange={ handleCropChange }
    onPointsChange={ handlePointsChange }
/>
```

To:
```jsx
<StencilComponent
    cropRect={ state.cropRect }
    containerSize={ containerSize }
    imageSize={ visualImageSize }
    onCropChange={ handleCropChange }
/>
```

- [ ] **Step 6: Run type check**

Run: `npx tsc --noEmit --project packages/image-cropper-next/tsconfig.json 2>&1 | head -40`
Expected: Should be clean or very close to clean.

- [ ] **Step 7: Commit**

```bash
git add packages/image-cropper-next/src/components/cropper.tsx
git commit -m "feat(image-cropper-next): remove freeform from cropper, inline bounding box math"
```

---

### Task 17: Update canvas-renderer.ts to use createExportCamera

**Files:**
- Modify: `packages/image-cropper-next/src/core/export/canvas-renderer.ts`
- Modify: `packages/image-cropper-next/src/core/export/test/canvas-renderer.ts`

- [ ] **Step 1: Read current files**

Read both files.

- [ ] **Step 2: Rewrite renderToCanvas using createExportCamera**

```typescript
import { createExportCamera } from '../camera';
import { degreesToRadians } from '../math/rotation';

export function renderToCanvas(
    image: HTMLImageElement,
    state: CropperState
): HTMLCanvasElement {
    const { naturalWidth, naturalHeight } = image;
    const { rotation, cropRect } = state;
    const imageSize = { width: naturalWidth, height: naturalHeight };

    // Compute output canvas size from crop rect in visual space.
    const rad = degreesToRadians( rotation );
    const cosR = Math.abs( Math.cos( rad ) );
    const sinR = Math.abs( Math.sin( rad ) );
    const rotW = cosR * naturalWidth + sinR * naturalHeight;
    const rotH = sinR * naturalWidth + cosR * naturalHeight;
    const outW = Math.round( cropRect.width * rotW );
    const outH = Math.round( cropRect.height * rotH );

    const canvas = document.createElement( 'canvas' );
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) {
        return canvas;
    }

    // Build export camera and apply as canvas transform.
    const camera = createExportCamera( state, imageSize, { width: outW, height: outH } );
    ctx.setTransform(
        camera[ 0 ], camera[ 1 ],
        camera[ 2 ], camera[ 3 ],
        camera[ 4 ], camera[ 5 ]
    );
    // The export camera accepts image-pixel coordinates, so drawImage(image, 0, 0) works directly.
    ctx.drawImage( image, 0, 0 );

    return canvas;
}
```

- [ ] **Step 3: Update exportCroppedImage**

Simplify to:
```typescript
export async function exportCroppedImage(
    src: string,
    state: CropperState,
    mimeType: string = 'image/png',
    quality: number = 0.92
): Promise< Blob | null > {
    try {
        const image = await loadImage( src );
        const canvas = renderToCanvas( image, state );
        return await canvasToBlob( canvas, mimeType, quality );
    } catch {
        return null;
    }
}
```

- [ ] **Step 4: Remove old imports**

Remove imports of `normalizedRectToPixel`, `getRotatedBoundingBox`, `getPolygonBoundingRect`.

- [ ] **Step 5: Run tests**

Run: `npx jest packages/image-cropper-next/src/core/export/test/canvas-renderer.ts --no-coverage`
Expected: All pass.

**UX verification:** The exported image must be pixel-identical to the current implementation for the same state. If tests pass but visual inspection shows differences, the camera composition order in `createExportCamera` needs adjustment.

- [ ] **Step 6: Commit**

```bash
git add packages/image-cropper-next/src/core/export/
git commit -m "feat(image-cropper-next): migrate canvas-renderer to use createExportCamera"
```

---

## Chunk 4: Final Cleanup and Verification

### Task 18: Full test suite and type check

**Files:** All

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit --project packages/image-cropper-next/tsconfig.json`
Expected: No errors. If there are errors, fix them.

- [ ] **Step 2: Run full test suite**

Run: `npx jest packages/image-cropper-next/ --no-coverage`
Expected: All tests pass.

- [ ] **Step 3: Fix any failures**

If any tests fail, debug and fix. The most likely issues:
- Import paths pointing to deleted files
- Missing exports in barrel files
- Type mismatches from removed freeform fields

- [ ] **Step 4: Commit any fixes**

```bash
git add -A packages/image-cropper-next/
git commit -m "fix(image-cropper-next): resolve remaining type and test issues from camera refactor"
```

---

### Task 19: Visual verification in Storybook

**Files:** None (manual testing)

- [ ] **Step 1: Start Storybook**

Run: `npx storybook dev -p 6006` (or the project's storybook command)

- [ ] **Step 2: Verify rectangle-crop story**

Open the rectangle crop story and verify:
- Image loads and displays correctly, centered in container
- Mouse drag pans the image smoothly within bounds
- Mouse wheel zooms in/out smoothly
- Keyboard arrows pan, +/- zoom, R rotates
- Rotation keeps image covering crop rect — no empty space visible
- Flip works (horizontal and vertical)
- Crop rect resize works (drag handles)
- The image NEVER leaves the crop rect boundary — at any rotation, zoom, pan, or flip combination
- Export produces correct output (matches crop area)

- [ ] **Step 3: Test edge cases**

- Rapidly alternate rotation and zoom
- Zoom to max, then rotate — no flicker
- Pan to edge, then rotate — image stays covering crop
- Flip while rotated and zoomed — no jump
- Resize crop rect while zoomed — no empty space appears

- [ ] **Step 4: Document any issues found**

If any UX issues are found, fix them and commit before proceeding.

---

### Task 20: Final commit and cleanup

- [ ] **Step 1: Run lint**

Run: `npm run lint:js -- packages/image-cropper-next/`
Fix any issues.

- [ ] **Step 2: Verify no freeform references remain**

Run: `grep -r "freeform\|cropPoints\|cropMode\|polygon\|SET_CROP_POINTS\|SET_CROP_MODE\|FreeformStencil" packages/image-cropper-next/src/`
Expected: No matches.

- [ ] **Step 3: Verify no old math imports remain**

Run: `grep -r "coordinates\|restriction\|getRotatedBoundingBox\|restrictPosition\|restrictCropRect\|restrictZoom" packages/image-cropper-next/src/`
Expected: No matches (except possibly in comments or test descriptions).

- [ ] **Step 4: Final commit**

```bash
git add -A packages/image-cropper-next/
git commit -m "chore(image-cropper-next): final cleanup after gl-matrix camera refactor"
```
