# Recipes and Getting Started

Getting started, extension points, and integration patterns.

## Getting started

### Step 1: Mount a basic cropper

```tsx
import { Cropper, useCropperState } from '@wordpress/media-editor';

function ImageEditor() {
  const controller = useCropperState();
  return (
    <Cropper
      src="https://example.com/photo.jpg"
      controller={ controller }
      showDimming
      showGrid
    />
  );
}
```

The cropper fills its parent container. Wrap it in a sized element:

```tsx
<div style={ { width: 600, height: 400 } }>
  <Cropper src={ imageUrl } controller={ controller } />
</div>
```

### Step 2: Add controls

`useCropperState` returns a single `controller` object bundling the state and a named setter for every supported transition:

```tsx
const controller = useCropperState();
const {
  state,
  setZoom, setRotation, setFlip, snapRotate90, setCropRect,
  applyOperation, reset, isDirty, getCroppedImage,
} = controller;

// Zoom slider
<input type="range" min={ 1 } max={ 10 } step={ 0.1 }
  value={ state.zoom } onChange={ e => setZoom( parseFloat( e.target.value ) ) } />

// Rotation buttons
<button onClick={ () => snapRotate90( -1 ) }>Rotate left</button>
<button onClick={ () => snapRotate90( 1 ) }>Rotate right</button>

// Flip
<button onClick={ () => setFlip( { horizontal: !state.flip.horizontal, vertical: state.flip.vertical } ) }>
  Flip H
</button>

// Reset
<button onClick={ () => reset() } disabled={ !isDirty }>Reset</button>
```

### Step 3: Export the result

```tsx
// As a Blob (for upload or further processing):
const blob = await getCroppedImage( 'image/jpeg', 0.9 );

// As source-pixel coordinates (for server-side processing):
import { getSourceRegion } from '@wordpress/media-editor';
const region = getSourceRegion( state, { width: naturalWidth, height: naturalHeight } );

// As percentages (for WP REST API /edit endpoint):
import { getSourceRegionPercent } from '@wordpress/media-editor';
const pct = getSourceRegionPercent( state, { width: naturalWidth, height: naturalHeight } );
```

## Architecture overview

```
Consumer (plugin/theme/AI agent)
    |
    v
useCropperState()          -- State management (reducer + convenience setters)
    |
    v
<Cropper>                  -- Orchestrates rendering and interaction
    |
    +-- stencil prop       -- Pluggable crop area UI (StencilProps interface)
    +-- useInteraction()   -- Mouse/touch/keyboard → reducer actions
    +-- useTransformStyle()-- State → CSS matrix
    |
    v
Pipeline / Export          -- TransformOperation[] → canvas → Blob
```

## Extension points

### 1. Custom stencils

The crop area UI is fully pluggable. Any component that implements `StencilProps` can replace the default `RectangleStencil`.

```tsx
import { Cropper, useCropperState } from '@wordpress/media-editor';
import type { StencilProps } from '@wordpress/media-editor';

function CircularStencil( { cropRect, containerSize, imageSize, onCropChange }: StencilProps ) {
  // Render a circular crop overlay using cropRect bounds.
  // Call onCropChange() when the user resizes.
  return <div className="circular-stencil">...</div>;
}

function MyCropper() {
  const controller = useCropperState();
  return <Cropper src="image.jpg" controller={ controller } stencil={ CircularStencil } />;
}
```

**StencilProps contract:**

| Prop | Type | Description |
|------|------|-------------|
| `cropRect` | `NormalizedRect` | Current crop area in [0,1] normalized space |
| `containerSize` | `Size` | Container pixel dimensions |
| `imageSize` | `Size` | Visual (rotated) image pixel dimensions |
| `onCropChange` | `(rect) => void` | Call during drag to update the crop |
| `onResizeEnd` | `() => void` | Call on mouseup to trigger settle animation |
| `aspectRatio` | `number?` | Locked aspect ratio (width/height) |
| `freeformCrop` | `boolean?` | Whether handles are shown |
| `stencilTransition` | `string?` | CSS transition for settle animation |
| `cropBounds` | `{minX,minY,maxX,maxY}?` | Allowed crop handle limits |

### 2. Transform pipeline (AI agent integration)

The pipeline is the primary interface for programmatic control. Operations are JSON-serializable, making them ideal for AI agents, undo/redo stacks, and remote control.

```typescript
import { useCropperState } from '@wordpress/media-editor';
import type { TransformOperation } from '@wordpress/media-editor';

// An AI agent generates a list of operations:
const operations: TransformOperation[] = [
  { type: 'crop', rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } },
  { type: 'rotate', degrees: 15 },
  { type: 'zoom', factor: 1.5 },
  { type: 'flip', direction: 'horizontal' },
];

// Apply them:
const { applyOperation } = useCropperState();
for ( const op of operations ) {
  applyOperation( op );
}
```

**Replay from scratch:**

```typescript
import { stateFromPipeline } from '@wordpress/media-editor';

// Replay a pipeline from initial state:
const finalState = stateFromPipeline( operations );

// Serialize for storage (operations are plain JSON):
const json = JSON.stringify( operations );

// Deserialize:
const ops = JSON.parse( json );
```

**Adding new operation types:**

1. Add the operation variant to `TransformOperation` in `core/types.ts`
2. Handle it in `applyOperationToState()` in `core/transforms/pipeline.ts`

### 3. Custom export pipelines

The export system converts cropper state to canvas output. Use `applyToCanvas()` to chain custom processing with the cropper transforms.

```typescript
import { applyToCanvas } from '@wordpress/media-editor';

// 1. Apply your own processing first (brightness, filters, etc.):
const processedCanvas = applyBrightness( sourceImage, { brightness: 1.2 } );

// 2. Apply the cropper transforms on top:
const finalCanvas = applyToCanvas(
  processedCanvas,
  { width: processedCanvas.width, height: processedCanvas.height },
  cropperState
);

// 3. Export however you need:
const blob = await new Promise( ( resolve ) =>
  finalCanvas.toBlob( resolve, 'image/jpeg', 0.9 )
);
```

`applyToCanvas()` accepts any `CanvasImageSource`: `HTMLImageElement`, `HTMLCanvasElement`, `OffscreenCanvas`, `ImageBitmap`, `HTMLVideoElement`.

### 4. State management patterns

The state is a plain object and the hook returns one `controller` bundle of state + named setters. There are two ways to wire it up depending on your component structure.

**Direct hook (simple case):**

When the cropper and controls are in the same component:

```tsx
import { Cropper, useCropperState } from '@wordpress/media-editor';

function ImageEditor() {
  const controller = useCropperState();
  const { state, setZoom, snapRotate90, reset } = controller;
  return (
    <div>
      <button onClick={ () => setZoom( state.zoom + 0.5 ) }>Zoom In</button>
      <button onClick={ () => snapRotate90( 1 ) }>Rotate 90</button>
      <button onClick={ () => reset() }>Reset</button>
      <Cropper src="image.jpg" controller={ controller } />
    </div>
  );
}
```

**Provider pattern (deep component trees):**

When controls and the cropper are in different parts of the tree, use `CropperProvider` to avoid prop-drilling. Any descendant can call `useCropper()` to access the controller:

```tsx
import { Cropper, CropperProvider, useCropper } from '@wordpress/media-editor';

function ImageEditor() {
  return (
    <CropperProvider>
      <Toolbar />
      <CropperPanel />
      <Sidebar />
    </CropperProvider>
  );
}

function Toolbar() {
  const { state, setZoom, snapRotate90 } = useCropper();
  return (
    <div>
      <button onClick={ () => setZoom( state.zoom + 0.5 ) }>Zoom In</button>
      <button onClick={ () => snapRotate90( 1 ) }>Rotate 90</button>
    </div>
  );
}

function CropperPanel() {
  const controller = useCropper();
  return <Cropper src="image.jpg" controller={ controller } freeformCrop />;
}

function Sidebar() {
  const { state } = useCropper();
  return <p>Zoom: { Math.round( state.zoom * 100 ) }%</p>;
}
```

**Programmatic control:**

```typescript
// Observe state:
useEffect( () => {
  console.log( 'Crop changed:', state.cropRect );
  // Send to analytics, sync with server, update AI context, etc.
}, [ state ] );

// Control programmatically — use the named setters:
controller.setZoom( 2.0 );
controller.setRotation( 45 );
controller.snapRotate90( 1 );
controller.settleCrop();
```

### 5. Source region for external tools

`getSourceRegion()` converts the current crop state to source-pixel coordinates. This is the bridge between the cropper and external tools (image processing libraries, AI APIs, server-side processing) that work in source-pixel coordinates.

```typescript
import { getSourceRegion } from '@wordpress/media-editor';

const region = getSourceRegion( state, { width: naturalWidth, height: naturalHeight } );
// region = { x, y, width, height, rotation, flip, zoom }

// Send to server for processing:
fetch( '/api/process', {
  method: 'POST',
  body: JSON.stringify( {
    imageId: 123,
    crop: { x: region.x, y: region.y, width: region.width, height: region.height },
    rotation: region.rotation,
    flip: region.flip,
  } ),
} );

// Send to AI API for region-specific editing:
const aiRequest = {
  region: { x: region.x, y: region.y, width: region.width, height: region.height },
  prompt: 'Remove the background in this area',
};
```

### 6. Multi-step editing pipelines

`applyToCanvas()` applies the cropper's transform to an existing canvas or image source. This enables multi-step editing where an upstream tool (brightness, color, filters) has already processed the image.

```typescript
import { applyToCanvas } from '@wordpress/media-editor';

// Step 1: Apply brightness/color adjustments to a canvas
const processedCanvas = applyBrightness( sourceImage, { brightness: 1.2 } );

// Step 2: Apply the crop/rotate/flip on top
const finalCanvas = applyToCanvas(
  processedCanvas,
  { width: processedCanvas.width, height: processedCanvas.height },
  cropperState
);

// Step 3: Export
const blob = await canvasToBlob( finalCanvas, 'image/jpeg', 0.9 );
```

Accepts any `CanvasImageSource`: `HTMLImageElement`, `HTMLCanvasElement`, `OffscreenCanvas`, `ImageBitmap`, `HTMLVideoElement`.

### 7. State change notifications

The `Cropper` component provides two notification mechanisms:

- **`onStateChange`** — fires on every state change (every frame during a drag). Use for real-time syncing, live previews, or analytics.
- **`onGestureStart` / `onGestureEnd`** — fire at gesture boundaries (pointerdown/pointerup, wheel burst start/end). Use for undo/redo snapshots, debounced saves, or "user finished editing" detection.

```tsx
<Cropper
  src="image.jpg"
  controller={ controller }
  onStateChange={ ( currentState ) => {
    // Fires every frame during drag — good for live preview.
    updateLivePreview( currentState );
  } }
  onGestureStart={ () => {
    // User started interacting — snapshot for undo.
    saveSnapshot( state );
  } }
  onGestureEnd={ () => {
    // User finished interacting — safe to save/sync.
    autosaveDraft( state );
  } }
/>
```

### 8. Theming and styling

The component uses BEM-style CSS classes that themes can override:

```
.wp-media-editor-image-editor                -- Container (cursor: grab)
.wp-media-editor-image-editor--dragging      -- Applied during image pan drag (cursor: grabbing)
.wp-media-editor-image-editor__image         -- The image element
.wp-media-editor-image-editor__stencil       -- Crop area container (pointer-events: none)
.wp-media-editor-image-editor__stencil-rect  -- Crop border rectangle
.wp-media-editor-image-editor__handle        -- Resize handle (all, pointer-events: auto)
.wp-media-editor-image-editor__handle--n     -- North handle (cursor: ns-resize)
.wp-media-editor-image-editor__handle--s     -- South handle (cursor: ns-resize)
.wp-media-editor-image-editor__handle--e     -- East handle (cursor: ew-resize)
.wp-media-editor-image-editor__handle--w     -- West handle (cursor: ew-resize)
.wp-media-editor-image-editor__handle--nw    -- North-west handle (cursor: nwse-resize)
.wp-media-editor-image-editor__handle--ne    -- North-east handle (cursor: nesw-resize)
.wp-media-editor-image-editor__handle--sw    -- South-west handle (cursor: nesw-resize)
.wp-media-editor-image-editor__handle--se    -- South-east handle (cursor: nwse-resize)
.wp-media-editor-image-editor__dimming       -- Dimming overlay outside crop area
.wp-media-editor-image-editor__grid          -- Grid overlay container
.wp-media-editor-image-editor__grid-line     -- Individual grid line
```

All styles are in CSS classes with no inline style overrides, so consumers can override anything with equal or higher specificity.

**Override handles and dimming:**

```css
.wp-media-editor-image-editor__handle {
  background: var(--wp--preset--color--primary);
  border-radius: 50%;
}
.wp-media-editor-image-editor__dimming {
  background: rgba(0, 0, 0, 0.6);
}
```

**Override cursors:**

```css
/* Use crosshair instead of grab */
.wp-media-editor-image-editor {
  cursor: crosshair;
}
.wp-media-editor-image-editor--dragging {
  cursor: move;
}
/* Custom handle cursor */
.wp-media-editor-image-editor__handle {
  cursor: pointer;
}
```

**Override handle appearance per position:**

```css
/* Only show corner handles, hide edge handles */
.wp-media-editor-image-editor__handle--n,
.wp-media-editor-image-editor__handle--s,
.wp-media-editor-image-editor__handle--e,
.wp-media-editor-image-editor__handle--w {
  display: none;
}
```

## AI agent integration patterns

### Driving the cropper from an AI agent

The pipeline API is designed for AI agents. An agent can:

1. **Analyze the image** and determine the optimal crop
2. **Generate a `TransformOperation[]`** with crop, rotation, zoom
3. **Apply it** via `applyOperation()` or `stateFromPipeline()`
4. **Export the result** via `exportCroppedImage()`

```typescript
// Agent generates instructions:
const agentInstructions = {
  crop: { x: 0.1, y: 0.05, width: 0.8, height: 0.9 },
  rotation: 2,  // slight straighten
  zoom: 1.1,
};

// Apply:
applyOperation( { type: 'crop', rect: agentInstructions.crop } );
applyOperation( { type: 'rotate', degrees: agentInstructions.rotation } );
applyOperation( { type: 'zoom', factor: agentInstructions.zoom } );
```

### Headless editing (no React, no DOM)

The core layer is pure functions — no React or browser required for steps 1-2:

```typescript
import {
  stateFromPipeline,
  getSourceRegion,
  exportCroppedImage,
} from '@wordpress/media-editor';

// 1. Build state from operations (pure — runs in Node, workers, anywhere)
const state = stateFromPipeline( [
  { type: 'crop', rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } },
  { type: 'rotate', degrees: 5 },
  { type: 'zoom', factor: 1.2 },
  { type: 'flip', direction: 'horizontal' },
] );

// 2. Get source-pixel region (pure — for server-side FFmpeg/ImageMagick)
const region = getSourceRegion( state, { width: 4000, height: 3000 } );
// → { x: 400, y: 300, width: 3200, height: 2400, rotation: 5, flip: {...}, zoom: 1.2 }

// Pass to server:
// ffmpeg -i input.jpg -vf "crop=3200:2400:400:300,rotate=0.087" output.jpg

// 3. Or export to Blob (needs canvas — browser or node-canvas)
const blob = await exportCroppedImage( imageUrl, state, 'image/jpeg', 0.9 );
```

Steps 1 and 2 are pure functions with zero DOM dependencies. Step 3 needs `canvas` and `Image` (browser, jsdom, or node-canvas).

## Multi-step editing integration

The package is designed to be one step in a broader image editing pipeline. Key integration patterns:

### Crop as a step (Google Photos style)

The state is external and serializable. You can:
1. Mount the Cropper, let the user crop
2. Snapshot `state` (it's a plain object)
3. Switch to a brightness/color tab (unmount Cropper, the state persists)
4. Switch back — restore `state`, remount Cropper, pick up where you left off

```typescript
// Save state when switching tabs:
const savedCropState = { ...state };

// Restore when coming back:
const controller = useCropperState( savedCropState );
```

### Undo/redo with gesture support

The `Cropper` component fires `onGestureStart` and `onGestureEnd` callbacks at the boundaries of continuous interactions (pan drags, handle resizes, wheel/pinch zoom). These let you snapshot state before and after each gesture, treating the entire drag as a single undo step.

**Two kinds of undo entries:**

1. **Toolbar operations** (rotate, flip, zoom buttons) — snapshot state before calling a setter, then apply the `TransformOperation`.
2. **Gestures** (drag, resize, wheel zoom) — snapshot state in `onGestureStart`, compare with the current state in `onGestureEnd`, and push the before-state onto the undo stack.

See the `UndoRedo` story for a complete working example. Here is the core pattern:

```tsx
import { Cropper, useCropperState } from '@wordpress/media-editor';
import type { CropperState, TransformOperation } from '@wordpress/media-editor';
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';

function ImageEditorWithUndo( { src }: { src: string } ) {
  const controller = useCropperState();
  const { state, applyOperation, reset } = controller;

  // Keep a ref to the latest state so gesture callbacks never go stale.
  const stateRef = useRef( state );
  stateRef.current = state;

  // Undo/redo stacks store full CropperState snapshots.
  const [ past, setPast ] = useState< CropperState[] >( [] );
  const [ future, setFuture ] = useState< CropperState[] >( [] );

  // Ref to hold the state snapshot captured at gesture start.
  const snapshotRef = useRef< CropperState | null >( null );

  // --- Toolbar operations ---

  const applyToolbarOp = useCallback(
    ( op: TransformOperation ) => {
      // Snapshot current state before applying.
      setPast( ( prev ) => [ ...prev, { ...state } ] );
      setFuture( [] );
      applyOperation( op );
    },
    [ state, applyOperation ]
  );

  // --- Gesture-based undo ---

  const handleGestureStart = useCallback( () => {
    // Capture state at the start of the gesture (via ref to avoid stale closure).
    snapshotRef.current = { ...stateRef.current };
  }, [] );

  const handleGestureEnd = useCallback( () => {
    if ( ! snapshotRef.current ) {
      return;
    }
    const before = snapshotRef.current;
    snapshotRef.current = null;

    // Push the before-state as an undo entry.
    setPast( ( prev ) => [ ...prev, before ] );
    setFuture( [] );
  }, [] );

  // --- Undo / Redo ---

  const undo = useCallback( () => {
    if ( past.length === 0 ) {
      return;
    }
    const newPast = [ ...past ];
    const previous = newPast.pop()!;
    setPast( newPast );
    setFuture( ( prev ) => [ ...prev, { ...state } ] );
    reset( previous );
  }, [ past, state, reset ] );

  const redo = useCallback( () => {
    if ( future.length === 0 ) {
      return;
    }
    const newFuture = [ ...future ];
    const next = newFuture.pop()!;
    setPast( ( prev ) => [ ...prev, { ...state } ] );
    setFuture( newFuture );
    reset( next );
  }, [ future, state, reset ] );

  // --- Keyboard shortcuts (use refs to avoid stale closures) ---

  const undoRef = useRef( undo );
  const redoRef = useRef( redo );
  undoRef.current = undo;
  redoRef.current = redo;

  useEffect( () => {
    const handler = ( e: KeyboardEvent ) => {
      if ( ( e.metaKey || e.ctrlKey ) && e.key === 'z' ) {
        e.preventDefault();
        if ( e.shiftKey ) {
          redoRef.current();
        } else {
          undoRef.current();
        }
      }
    };
    document.addEventListener( 'keydown', handler );
    return () => document.removeEventListener( 'keydown', handler );
  }, [] );

  return (
    <div>
      <div>
        <button onClick={ undo } disabled={ past.length === 0 }>
          Undo ({ past.length })
        </button>
        <button onClick={ redo } disabled={ future.length === 0 }>
          Redo ({ future.length })
        </button>
        <button onClick={ () => applyToolbarOp( { type: 'rotate', degrees: 15 } ) }>
          Rotate +15
        </button>
      </div>

      <Cropper
        src={ src }
        controller={ controller }
        freeformCrop
        onGestureStart={ handleGestureStart }
        onGestureEnd={ handleGestureEnd }
      />
    </div>
  );
}
```

**Key implementation details:**

| Concern | Solution |
|---------|----------|
| Stale closures in gesture callbacks | Use `useRef` for state (`stateRef`) and snapshot (`snapshotRef`). The callbacks are stable (`[]` deps) and always read the latest value. |
| Stale closures in keyboard handler | Use `undoRef` / `redoRef` updated on every render, with the listener registered once (`[]` deps). |
| Wheel zoom boundaries | The `useInteraction` hook debounces wheel events — it fires `onGestureStart` on the first scroll tick and `onGestureEnd` after 300ms of inactivity, grouping a burst of scroll events into one undo step. |
| Handle resize settle | `onGestureEnd` fires after the settle animation (crop re-centers). The undo snapshot captures the final settled state. |
| Pipeline display | For toolbar ops, log the `TransformOperation`. For gestures, compare before/after state and generate a descriptive label (e.g., "gesture: pan, zoom 1.5x"). |

## Accessibility

The cropper is keyboard-accessible and screen-reader friendly:

**Keyboard controls:**
- **Arrow keys** on the container: pan the image
- **+/-** on the container: zoom in/out
- **R** on the container: snap rotate 90°
- **Tab** to crop handles, then **arrow keys** to resize (0.02 step per keypress)
- Aspect ratio lock is respected during keyboard resize

**Screen reader support:**
- Container is a focusable `role="group"` with `aria-label="Image editor"`. We deliberately avoid `role="application"` because it disables the screen reader's default keybindings — too heavy for a single widget.
- Resize handles are native `<button>` elements with descriptive `aria-label` (e.g., "Resize top-left corner"). Native buttons give correct focus behavior and announcements without extra ARIA.
- An ARIA live region announces state changes (zoom, rotation, crop dimensions) with 300ms debounce.

**For theme/plugin developers:**
- Custom stencils should preserve `tabIndex`, `role`, and `aria-*` attributes on interactive elements
- Use `aria-live="polite"` for any custom state announcements
- Ensure custom overlays don't trap keyboard focus

## WordPress integration patterns

These patterns show how the cropper integrates with WordPress-specific systems. They consume the existing API — no package changes needed.

### Theme-aware aspect ratio presets

WordPress themes register image sizes via `add_image_size()`. The cropper can suggest aspect ratios that match the active theme's layout:

```typescript
import { DEFAULT_ASPECT_RATIOS } from '@wordpress/media-editor';
import type { AspectRatioPreset } from '@wordpress/media-editor';

// Build presets from theme's registered image sizes.
function getThemePresets( imageSizes ): AspectRatioPreset[] {
  const themePresets = imageSizes
    .filter( size => size.width && size.height )
    .map( size => ( {
      label: `${ size.name } (${ size.width }×${ size.height })`,
      value: size.width / size.height,
    } ) );
  return [ ...DEFAULT_ASPECT_RATIOS, ...themePresets ];
}

// Or let plugins add presets via WordPress hooks:
const presets = wp.hooks.applyFilters(
  'imageEditing.aspectRatioPresets',
  DEFAULT_ASPECT_RATIOS
);
```

### Block context integration

When the cropper opens from a block (Image, Cover, Media & Text), the block knows its target layout. Pass the block's aspect ratio as the default:

```typescript
// In the Image block's edit component:
const blockAspectRatio = getBlockAspectRatio( blockAttributes );

<Cropper
  src={ imageUrl }
  controller={ controller }
  aspectRatio={ blockAspectRatio }  // Pre-set to match block layout
/>
```

Cover blocks at 16:9 open the cropper at 16:9. Avatar blocks open at 1:1. The user sees the right crop immediately.

### WordPress hooks integration

Use `onStateChange` to bridge into the WordPress hooks system:

```typescript
<Cropper
  src={ imageUrl }
  controller={ controller }
  onStateChange={ ( currentState ) => {
    // Let plugins react to crop changes.
    wp.hooks.doAction( 'imageEditing.stateChanged', currentState );
  } }
/>

// In a plugin:
wp.hooks.addAction( 'imageEditing.stateChanged', 'my-plugin', ( state ) => {
  // Update preview, sync with server, trigger AI analysis, etc.
} );
```

Plugins can also filter the available controls:

```typescript
// Let plugins add custom toolbar buttons.
const extraControls = wp.hooks.applyFilters(
  'imageEditing.toolbarControls',
  [],
  state
);

// Let plugins modify the export before saving.
wp.hooks.addFilter( 'imageEditing.beforeSave', 'my-plugin', ( blob, state ) => {
  // Add watermark, compress further, convert format, etc.
  return processedBlob;
} );
```

### REST API and media library

Save crop metadata to the attachment via the REST API so the server can regenerate crops:

```typescript
import { getSourceRegion } from '@wordpress/media-editor';

// After the user finishes editing:
const region = getSourceRegion( state, {
  width: attachment.naturalWidth,
  height: attachment.naturalHeight,
} );

// Save to the attachment's metadata.
wp.apiFetch( {
  path: `/wp/v2/media/${ attachment.id }`,
  method: 'POST',
  data: {
    meta: {
      crop_region: {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        rotation: region.rotation,
        flip: region.flip,
      },
    },
  },
} );
```

This enables:
- Server-side crop regeneration when themes change image sizes
- Crop history per attachment
- "Reset to original" using stored metadata
- Multiple crops per registered size (future)

## Testing

### Running unit tests

```bash
# All media-editor/image-editor unit tests
npx wp-scripts test-unit-js --testPathPattern="media-editor/image-editor"

# Specific test file (e.g., camera tests only)
npx wp-scripts test-unit-js --testPathPattern="media-editor/image-editor" --testNamePattern="camera"

# TypeScript type checking (no emit)
npx tsc --project packages/media-editor/src/image-editor/tsconfig.json --noEmit
```

### Running visual regression tests (storybook-playwright)

Visual regression tests use Playwright to screenshot Storybook stories and compare against baseline images. The spec is at `test/storybook-playwright/specs/image-editor.spec.ts`.

```bash
# Start Storybook first (port 50241)
npm run storybook

# Run the visual regression tests
npx playwright test test/storybook-playwright/specs/image-editor.spec.ts

# Update screenshots after intentional visual changes
npx playwright test test/storybook-playwright/specs/image-editor.spec.ts --update-snapshots
```

### What the tests cover

**Export matrix verification** (`core/export/test/canvas-renderer.ts`):
- Identity state produces a 1:1 scale mapping with no rotation components
- 90-degree rotation encodes rotation in the off-diagonal matrix values (a,d near zero; b,c non-zero with opposite signs)
- Zoom 2x doubles the scale components relative to zoom 1x
- Horizontal flip negates the x-scale component
- `applyToCanvas` creates a canvas with correct dimensions and calls `setTransform`

**Containment invariant** (`core/test/camera.ts`):
- Verifies the image fully covers the crop area across multiple rotation and zoom combinations
- Tests `restrictPanZoom` and `restrictCropRect` boundary enforcement
- Run after any changes to camera restriction logic

**Visual regression** (`test/storybook-playwright/specs/image-editor.spec.ts`):
- Screenshots the Default and WithControls stories
- Catches unintended visual changes to the cropper UI

### Adding new test cases

1. **New export transform tests**: Add to the `renderToCanvas -- export matrix verification` describe block in `core/export/test/canvas-renderer.ts`. Use `setupMockCanvas()` to initialize mocks, then call `renderToCanvas` and inspect `mockCtx.setTransform.mock.calls[0]` for the 6 matrix values `[a, b, c, d, e, f]`.

2. **New containment invariant cases**: Add rotation/zoom combinations to the parametric test in `core/test/camera.ts`.

3. **New visual regression stories**: Add a new test case in `test/storybook-playwright/specs/image-editor.spec.ts` using `gotoStoryId` with the Storybook story ID (format: `mediaeditor-imagecropper--story-name`).

