# Image Editor

> **Status: internal.** This module is not exported from `@wordpress/media-editor`'s public API. Only code inside `@wordpress/media-editor` should import it, via relative paths (e.g. `../image-editor`). When the module is promoted to the package's public surface, the `@wordpress/media-editor` import paths used in these docs will work.

A modular image editor inside `@wordpress/media-editor`. Three layers:

-   **Core cropper API** — framework-agnostic state, math, transform pipeline, source-region helpers, and export helpers. Pure TypeScript + `gl-matrix`. The export helpers in `core/export/` are browser-only (they use `HTMLCanvasElement` and `Image`), but the state, camera, containment, and pipeline helpers have no DOM or React dependency.
-   **React adapter** — the bundled UI implementation used by the media editor. It wraps core with `<Cropper>`, `useCropperState`, and the optional `CropperProvider` / `useCropper` context pair. `useInteraction` and `useTransformStyle` exist internally but are not exported.
-   **Media editor modal integration** — WordPress attachment records, REST `/edit` requests, metadata fields, notices, modal close/discard behavior, and toolbar/sidebar composition. This layer owns product workflow, not reusable crop geometry.

## Quick start

```tsx
import { Cropper, useCropperState } from '../image-editor';

function ImageEditor() {
	const controller = useCropperState();
	return (
		<div style={ { width: 600, height: 400 } }>
			<Cropper
				src="https://example.com/photo.jpg"
				controller={ controller }
				showDimming
				showGrid
				freeformCrop
			/>
		</div>
	);
}
```

`useCropperState` returns a single `controller` object that bundles the current state and every setter. Pass it to `<Cropper>` as a single prop, and call setters like `controller.setZoom( 2 )` or `controller.snapRotate90( 1 )` from your own toolbars.

## MVP contracts

These contracts are the current bar for the internal MVP. Treat them as design constraints when changing UX or implementation details.

-   **Core state is plain normalized image-space data.** Core helpers accept and return serializable cropper state; they do not own React state, history, attachment records, or modal workflow.
-   **React UI state is changed through named controller methods.** Do not expose or depend on reducer actions outside the image editor internals.
-   **Crop geometry is normalized image-space data.** `cropRect` and `pan` use normalized coordinates rather than DOM pixels so the core state can be tested independently of any rendered size.
-   **Preview, canvas export, and server modifiers must stay equivalent.** What the user frames in the crop area must match the output from `exportCroppedImage()` and the modifiers sent to the WordPress REST API.
-   **Undo and redo are React adapter workflow, not core cropper API.** The bundled media editor UI should commit continuous gestures as one user action and discrete commands as one undo entry, but core helpers should stay history-agnostic.
-   **Keyboard access is part of the React cropper contract.** Users must be able to focus the crop area, pan the image, zoom, reach resize handles, resize the crop area, leave handles with Escape, and use undo/redo shortcuts in the media editor shell.
-   **The modal owns WordPress attachment integration.** The reusable cropper should not know about attachment records, REST endpoints, metadata fields, notices, or modal close behavior.

## Styles

The cropper's styles are compiled as part of `@wordpress/media-editor`'s SCSS build. Internal callers that render `<Cropper>` inherit them automatically when the package's stylesheet is loaded. All CSS classes use the `wp-media-editor-image-editor` prefix.

## Docs

-   [docs/architecture.md](docs/architecture.md) — Data flow, coordinate spaces, and design decisions
-   [docs/recipes.md](docs/recipes.md) — Getting started walkthrough, extension points, and integration patterns

## API Reference

### Core cropper API

The core cropper API is the stable conceptual base: plain state, pure transforms, source-region conversion, and export helpers. It does not include React hooks, DOM events, toolbar controls, undo/redo history, or WordPress attachment integration.

#### State contract

`CropperState` is intentionally plain data. The core reducer, transform pipeline, and export helpers all operate on this shape.

| Field          | Coordinates / type                            | Role                                                                                                             |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `image`        | `{ src, naturalWidth, naturalHeight } \| null` | Loaded source image metadata. `null` before the image has loaded.                                                |
| `pan`          | `NormalizedPoint`                             | Image pan offset. This describes where the image sits behind the crop area; it is not the crop rectangle.        |
| `zoom`         | `number`                                      | Image zoom. The reducer clamps it to the supported zoom range.                                                   |
| `rotation`     | `number`                                      | Absolute image rotation in degrees, normalized to `[0, 360)`.                                                    |
| `flip`         | `Flip`                                        | Horizontal and vertical flip flags.                                                                              |
| `cropRect`     | `NormalizedRect`                              | Selected crop area in normalized image space.                                                                    |
| `basePan`      | `NormalizedPoint`                             | Implementation detail used by fine rotation to avoid drift while containment is enforced.                        |
| `baseZoom`     | `number`                                      | Implementation detail used as the zoom floor while fine rotation temporarily adjusts containment.                |
| `baseRotation` | `number`                                      | Implementation detail used to derive fine-rotation deltas without compounding state on every slider/ruler tick. |

UI code should treat `basePan`, `baseZoom`, and `baseRotation` as internal bookkeeping. User-facing controls should read and write `pan`, `zoom`, `rotation`, `flip`, and `cropRect` through the React controller methods or transform pipeline.

#### Source region

##### `getSourceRegion( state, imageSize ): SourceRegion`

Converts crop state to source-pixel coordinates: `{ x, y, width, height, rotation, flip, zoom }`. For server-side processing (FFmpeg, ImageMagick, etc.).

##### `getSourceRegionPercent( state, imageSize ): SourceRegionPercent`

Same as `getSourceRegion` but returns percentages (0–100): `{ x, y, width, height }`. Compatible with the WordPress REST API attachments `/edit` endpoint.

#### Export

##### `exportCroppedImage( src, state, mimeType?, quality? ): Promise<Blob>`

End-to-end: load image, render with transforms, export as Blob. Browser-only (needs `HTMLCanvasElement`).

Rejects on:

-   **Image load failures** (network error, 404) — the native load error is propagated.
-   **CORS / tainted canvas** — if the source doesn't set `Access-Control-Allow-Origin`, `canvas.toBlob()` rejects because the canvas is tainted. Fix at the server: send permissive CORS headers.
-   **Missing canvas context** — throws with a descriptive `Error`.

Wrap in `try/catch` to distinguish failure modes.

##### `applyToCanvas( source: CanvasImageSource, imageSize, state ): HTMLCanvasElement`

Applies transforms to any `CanvasImageSource` (image, canvas, video frame, offscreen canvas). For multi-step editing pipelines.

#### Pipeline

##### `stateFromPipeline( operations: TransformOperation[] ): CropperState`

Replays a sequence of operations from default state. Pure function, no DOM needed. For headless/server-side processing.

##### `applyOperationToState( state, operation ): CropperState`

Applies a single operation to an existing state.

### React adapter

The React adapter is the bundled implementation used by the media editor UI. It is a practical UI controller over the core cropper state; it is not the same thing as the framework-agnostic core API.

#### Components

##### `Cropper`

Main cropper component. Fills its parent container.

| Prop                | Type                               | Default            | Description                                                                                                                                                                                       |
| ------------------- | ---------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`               | `string`                           | **required**       | Image source URL.                                                                                                                                                                                 |
| `controller`        | `UseCropperStateReturn`            | **required**       | The full object returned by `useCropperState()`.                                                                                                                                                  |
| `stencil`           | `ComponentType<StencilProps>`      | `RectangleStencil` | Custom crop area UI.                                                                                                                                                                              |
| `showGrid`          | `boolean \| 'interactive'`         | `false`            | Rule-of-thirds grid overlay. `'interactive'` shows the grid while the user is placing, zooming, dragging, or resizing.                                                                            |
| `isPlacementActive` | `boolean`                          | `false`            | Keeps the interactive grid visible while an external placement control, such as the zoom slider or rotation ruler, is active.                                                                      |
| `showDimming`       | `boolean`                          | `true`             | Dimming overlay outside crop.                                                                                                                                                                     |
| `minZoom`           | `number`                           | `1`                | Minimum zoom for interactive gestures (wheel, pinch, double-tap). The reducer itself clamps to `[1, 10]` regardless, so a larger `minZoom` only narrows what the user can reach through gestures. |
| `maxZoom`           | `number`                           | `10`               | Maximum zoom for interactive gestures. Same caveat as `minZoom`.                                                                                                                                  |
| `aspectRatio`       | `number`                           | —                  | Fixed aspect ratio (width/height).                                                                                                                                                                |
| `freeformCrop`      | `boolean`                          | `false`            | Enables resize handles.                                                                                                                                                                           |
| `focusOnMount`      | `boolean`                          | `false`            | Focuses the crop area when the cropper mounts.                                                                                                                                                    |
| `onImageLoaded`     | `(size: Size) => void`             | —                  | Image load callback.                                                                                                                                                                              |
| `onStateChange`     | `(state: CropperState) => void`    | —                  | Fires on every state change (high frequency — at pointermove rate during drags). Avoid heavy work in the handler; for commit-style events use `onGestureEnd` instead.                             |
| `onGestureStart`    | `() => void`                       | —                  | Gesture boundary start.                                                                                                                                                                           |
| `onGestureEnd`      | `() => void`                       | —                  | Gesture boundary end.                                                                                                                                                                             |
| `className`         | `string`                           | —                  | Additional CSS class.                                                                                                                                                                             |

##### `CropperProvider` / `useCropper()`

Context wrapper for deep component trees. Wraps `useCropperState` and provides it to descendants via `useCropper()`.

#### Hooks

##### `useCropperState( initialState?: Partial<CropperState> ): UseCropperStateReturn`

State management hook. Returns a `controller` object with the current state and named setters used by the bundled React UI.

> **Pan vs. crop rectangle**: `setPan` / `state.pan` sets the image _pan offset_ (how the image is translated inside the viewport). `setCropRect` / `state.cropRect` sets the _crop rectangle_ (the region being selected).

| Field             | Type                                                 | Description                                                                         |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `state`           | `CropperState`                                       | Current state (read-only)                                                           |
| `setImage`        | `(image: CropperState['image']) => void`             | Set the loaded image (src + natural size)                                           |
| `setPan`          | `(pan: NormalizedPoint) => void`                     | Set image pan offset                                                                |
| `setZoom`         | `(zoom: number) => void`                             | Set zoom (clamped 1–10)                                                             |
| `setZoomAtPoint`  | `(zoom: number, pan: NormalizedPoint) => void`       | Set zoom and pan together for focal-point zoom                                      |
| `setRotation`     | `(degrees: number) => void`                          | Set rotation (normalized 0–360)                                                     |
| `setFlip`         | `(flip: Flip) => void`                               | Set flip state                                                                      |
| `toggleFlip`      | `(direction: 'horizontal' \| 'vertical') => void`    | Toggle one flip axis using the latest state                                         |
| `snapRotate90`    | `(direction: 1 \| -1) => void`                       | 90° snap rotation                                                                   |
| `setCropRect`     | `(rect: NormalizedRect) => void`                     | Set crop rectangle                                                                  |
| `settleCrop`      | `() => void`                                         | Settle the crop rect after a resize drag (typically from `onResizeEnd`)             |
| `applyOperation`  | `(op: TransformOperation) => void`                   | Apply a pipeline operation                                                          |
| `reset`           | `(state?: Partial<CropperState>) => void`            | Reset to initial or given state                                                     |
| `isDirty`         | `boolean`                                            | Whether state differs from initial                                                  |
| `getCroppedImage` | `(mime?: string, quality?: number) => Promise<Blob>` | Export as Blob. Throws on load/CORS/context failure — wrap in try/catch to recover. |

The bundled React controller also carries history state for the media editor implementation:

| Field     | Type         | Description                                       |
| --------- | ------------ | ------------------------------------------------- |
| `hasUndo` | `boolean`    | Whether there is a cropper state to undo.         |
| `hasRedo` | `boolean`    | Whether there is a cropper state to redo.         |
| `undo`    | `() => void` | Restore the previous committed cropper state.     |
| `redo`    | `() => void` | Restore the next cropper state after undo.        |

The hook currently exposes additional gesture-history plumbing for the media editor shell. Treat that wiring as React adapter implementation detail, not as part of the core cropper API. The controller does not expose the reducer dispatch; use the named setters or `applyOperation()` to change state.

### Types

| Type                    | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `CropperState`          | `{ image, pan, zoom, rotation, flip, cropRect, basePan, baseZoom, baseRotation }` |
| `UseCropperStateReturn` | The React adapter controller returned by `useCropperState()`                     |
| `CropperProps`          | Props for the `<Cropper>` component                                               |
| `StencilProps`          | Contract for pluggable stencil components                                         |
| `TransformOperation`    | `{ type: 'crop' \| 'rotate' \| 'flip' \| 'zoom', ... }`                           |
| `NormalizedPoint`       | `{ x: number, y: number }` in [0,1] space                                         |
| `NormalizedRect`        | `{ x, y, width, height }` in [0,1] space                                          |
| `Size`                  | `{ width: number, height: number }`                                               |
| `Flip`                  | `{ horizontal: boolean, vertical: boolean }`                                      |
| `SourceRegion`          | `{ x, y, width, height, rotation, flip, zoom }` in source pixels                  |
| `SourceRegionPercent`   | `{ x, y, width, height }` as percentages (0–100)                                  |
| `AspectRatioPreset`     | `{ label: string, value: number }`                                                |

`CropperAction` (the reducer's action union) is internal. Drive state through the named setters on the controller object.

### Constants

| Constant                | Value | Description                                            |
| ----------------------- | ----- | ------------------------------------------------------ |
| `DEFAULT_STATE`         | —     | Default `CropperState`                                 |
| `DEFAULT_ASPECT_RATIOS` | Array | Preset aspect ratios (Free, Original, 1:1, 16:9, etc.) |
| `ORIGINAL_ASPECT_RATIO` | `-1`  | Sentinel value for "use image's original ratio"        |
