# Image Editor

> **Status: internal.** This module is not exported from `@wordpress/media-editor`'s public API. Only code inside `@wordpress/media-editor` should import it, via relative paths (e.g. `../image-editor`). When the module is promoted to the package's public surface, the `@wordpress/media-editor` import paths used in these docs will work.

A modular image editor inside `@wordpress/media-editor`. Two layers:

-   **Core** — framework-agnostic state, math, and interaction logic. Pure TypeScript + `gl-matrix`. The export helpers in `core/export/` are browser-only (they use `HTMLCanvasElement` and `Image`), but everything else — reducer, camera math, interaction controller — has no DOM or React dependency. A non-React UI layer (Vue, Svelte, vanilla) can reuse core directly.
-   **React adapter** — thin wrappers over core. The public surface is `<Cropper>`, `useCropperState`, plus the optional `CropperProvider` / `useCropper` context pair. `useInteraction` and `useTransformStyle` exist internally but are not exported.

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

## Styles

The cropper's styles are compiled as part of `@wordpress/media-editor`'s SCSS build. Internal callers that render `<Cropper>` inherit them automatically when the package's stylesheet is loaded. All CSS classes use the `wp-media-editor-image-editor` prefix.

## Docs

-   [docs/architecture.md](docs/architecture.md) — Data flow, coordinate spaces, and design decisions
-   [docs/recipes.md](docs/recipes.md) — Getting started walkthrough, extension points, and integration patterns
-   [docs/roadmap.md](docs/roadmap.md) — Planned follow-up work and phases

## API Reference

### React components

#### `Cropper`

Main cropper component. Fills its parent container.

| Prop             | Type                            | Default            | Description                                                                                                                                                                                       |
| ---------------- | ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`            | `string`                        | **required**       | Image source URL                                                                                                                                                                                  |
| `controller`     | `UseCropperStateReturn`         | **required**       | The full object returned by `useCropperState()`                                                                                                                                                   |
| `stencil`        | `ComponentType<StencilProps>`   | `RectangleStencil` | Custom crop area UI                                                                                                                                                                               |
| `showGrid`       | `boolean`                       | `false`            | Rule-of-thirds grid overlay                                                                                                                                                                       |
| `showDimming`    | `boolean`                       | `true`             | Dimming overlay outside crop                                                                                                                                                                      |
| `showDimensions` | `boolean`                       | `true`             | Live output-dimensions tooltip that follows the active resize handle                                                                                                                              |
| `minZoom`        | `number`                        | coverage-aware     | Minimum zoom for interactive gestures (wheel, pinch, double-tap). Defaults to the coverage-aware floor, which can drop below `1` when the crop remains covered.                                  |
| `maxZoom`        | `number`                        | `10`               | Maximum zoom for interactive gestures. User-requested zoom is clamped to this maximum while containment still enforces the coverage-aware lower bound.                                             |
| `aspectRatio`    | `number`                        | —                  | Fixed aspect ratio (width/height)                                                                                                                                                                 |
| `freeformCrop`   | `boolean`                       | `false`            | Enable resize handles                                                                                                                                                                             |
| `onImageLoaded`  | `(size: Size) => void`          | —                  | Image load callback                                                                                                                                                                               |
| `onStateChange`  | `(state: CropperState) => void` | —                  | Fires on every state change (high frequency — at pointermove rate during drags). Avoid heavy work in the handler; for commit-style events use `onGestureEnd` instead.                             |
| `onGestureStart` | `() => void`                    | —                  | Gesture boundary start                                                                                                                                                                            |
| `onGestureEnd`   | `() => void`                    | —                  | Gesture boundary end                                                                                                                                                                              |
| `className`      | `string`                        | —                  | Additional CSS class                                                                                                                                                                              |

#### `CropperProvider` / `useCropper()`

Context wrapper for deep component trees. Wraps `useCropperState` and provides it to descendants via `useCropper()`.

### React hooks

#### `useCropperState( initialState?: Partial<CropperState> ): UseCropperStateReturn`

State management hook. Returns a `controller` object with the current state and a named setter for each supported transition.

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
| `snapRotate90`    | `(direction: 1 \| -1) => void`                       | 90° snap rotation                                                                   |
| `setCropRect`     | `(rect: NormalizedRect) => void`                     | Set crop rectangle                                                                  |
| `settleCrop`      | `() => void`                                         | Settle the crop rect after a resize drag (typically from `onResizeEnd`)             |
| `applyOperation`  | `(op: TransformOperation) => void`                   | Apply a pipeline operation                                                          |
| `reset`           | `(state?: Partial<CropperState>) => void`            | Reset to initial or given state                                                     |
| `isDirty`         | `boolean`                                            | Whether state differs from initial                                                  |
| `getCroppedImage` | `(mime?: string, quality?: number) => Promise<Blob>` | Export as Blob. Throws on load/CORS/context failure — wrap in try/catch to recover. |

The controller does not expose the reducer dispatch. Use the named setters or `applyOperation()` to change state.

### Source region

#### `getSourceRegion( state, imageSize ): SourceRegion`

Converts crop state to source-pixel coordinates: `{ x, y, width, height, rotation, flip, zoom }`. For server-side processing (FFmpeg, ImageMagick, etc.).

#### `getSourceRegionPercent( state, imageSize ): SourceRegionPercent`

Same as `getSourceRegion` but returns percentages (0–100): `{ x, y, width, height }`. Compatible with the WordPress REST API attachments `/edit` endpoint.

### Export

#### `exportCroppedImage( src, state, mimeType?, quality? ): Promise<Blob>`

End-to-end: load image, render with transforms, export as Blob. Browser-only (needs `HTMLCanvasElement`).

Rejects on:

-   **Image load failures** (network error, 404) — the native load error is propagated.
-   **CORS / tainted canvas** — if the source doesn't set `Access-Control-Allow-Origin`, `canvas.toBlob()` rejects because the canvas is tainted. Fix at the server: send permissive CORS headers.
-   **Missing canvas context** — throws with a descriptive `Error`.

Wrap in `try/catch` to distinguish failure modes.

#### `applyToCanvas( source: CanvasImageSource, imageSize, state ): HTMLCanvasElement`

Applies transforms to any `CanvasImageSource` (image, canvas, video frame, offscreen canvas). For multi-step editing pipelines.

### Pipeline

#### `stateFromPipeline( operations: TransformOperation[] ): CropperState`

Replays a sequence of operations from default state. Pure function, no DOM needed. For headless/server-side processing.

#### `applyOperationToState( state, operation ): CropperState`

Applies a single operation to an existing state.

### Types

| Type                    | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `CropperState`          | `{ image, pan, zoom, rotation, flip, cropRect, basePan, baseZoom, baseRotation }` |
| `UseCropperStateReturn` | The full shape returned by `useCropperState()`: state + setters                   |
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
