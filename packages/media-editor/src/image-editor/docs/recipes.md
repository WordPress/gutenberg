# Image Editor Recipes

> **Status: internal.** Import from `../image-editor` only inside `@wordpress/media-editor`.

## Mount a Cropper

```tsx
import { Cropper, useCropperReducer } from '../image-editor';

function ImageCropper( { src }: { src: string } ) {
	const controller = useCropperReducer();

	return (
		<div style={ { width: 600, height: 400 } }>
			<Cropper
				src={ src }
				controller={ controller }
				freeformCrop
				showDimming
				showGrid="interactive"
			/>
		</div>
	);
}
```

The cropper fills its parent. Always render it inside a sized container.

## Add Controls

```tsx
function ImageCropperWithControls( { src }: { src: string } ) {
	const controller = useCropperReducer();
	const { state, setZoom, snapRotate90, toggleFlip, reset } = controller;

	return (
		<>
			<button onClick={ () => setZoom( state.zoom + 0.5 ) }>
				Zoom in
			</button>
			<button onClick={ () => snapRotate90( 1 ) }>Rotate right</button>
			<button onClick={ () => toggleFlip( 'horizontal' ) }>
				Flip horizontal
			</button>
			<button onClick={ () => reset() } disabled={ ! controller.isDirty }>
				Reset
			</button>
			<Cropper src={ src } controller={ controller } freeformCrop />
		</>
	);
}
```

When internal controls are split across components, use `CropperProvider`.

```tsx
import { Cropper, CropperProvider, useCropper } from '../image-editor';

function Editor( { src }: { src: string } ) {
	return (
		<CropperProvider>
			<Toolbar />
			<CropperPanel src={ src } />
		</CropperProvider>
	);
}

function Toolbar() {
	const { snapRotate90 } = useCropper();
	return <button onClick={ () => snapRotate90( 1 ) }>Rotate right</button>;
}

function CropperPanel( { src }: { src: string } ) {
	const controller = useCropper();
	return <Cropper src={ src } controller={ controller } freeformCrop />;
}
```

## Use the Media Editor Composite Controller

Use the media editor controller when cropper state must share history with controls such as aspect ratio.

```tsx
import { resolveAspectRatio, useMediaEditor } from '../../state';
import { Cropper } from '../image-editor';

function MediaEditorCanvas( { src }: { src: string } ) {
	const controller = useMediaEditor();
	const aspectRatio = resolveAspectRatio(
		controller.cropOptions.aspectRatioValue,
		controller.state.image
	);

	return (
		<Cropper
			src={ src }
			controller={ controller }
			aspectRatio={ aspectRatio }
			freeformCrop
			onGestureStart={ controller.beginGesture }
			onGestureEnd={ controller.endGesture }
		/>
	);
}
```

## Get Source Coordinates

Use source-region helpers when saving crop data instead of rendering a `Blob`.

```ts
import { getSourceRegion, getSourceRegionPercent } from '../image-editor';

const imageSize = { width: naturalWidth, height: naturalHeight };
const region = getSourceRegion( controller.state, imageSize );
const percent = getSourceRegionPercent( controller.state, imageSize );
```

`getSourceRegionPercent()` matches the crop data shape used by the WordPress attachments `/edit` endpoint.

## Export a Cropped Image

```ts
const blob = await controller.getCroppedImage( 'image/jpeg', 0.9 );
```

For a custom canvas pipeline, use `applyToCanvas()`.

```ts
import { applyToCanvas } from '../image-editor';

const output = applyToCanvas(
	processedCanvas,
	{ width: processedCanvas.width, height: processedCanvas.height },
	controller.state
);
```

Canvas export is browser-only. Cross-origin images need valid CORS headers or the canvas will be tainted.

## Programmatic Edits

`TransformOperation` values are plain JSON. Apply them one at a time or replay them from scratch.

```ts
import { stateFromPipeline, type TransformOperation } from '../image-editor';

const operations: TransformOperation[] = [
	{ type: 'crop', rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } },
	{ type: 'rotate', degrees: 5 },
	{ type: 'flip', direction: 'horizontal' },
];

for ( const operation of operations ) {
	controller.applyOperation( operation );
}

const finalState = stateFromPipeline( operations );
```

## Accessibility Notes

-   The crop area is focusable and keyboard-operable.
-   Resize handles are native buttons.
-   Arrow keys pan the image or resize the focused handle.
-   Shift increases keyboard pan/resize distance.
-   `R` performs a 90 degree rotation.
-   State changes are announced through an ARIA live region.

## Tests

Run focused unit tests with:

```bash
npm run test:unit packages/media-editor/src/image-editor -- --runInBand
```

Useful test areas:

-   `core/test/camera.ts` for containment and camera invariants.
-   `core/test/state.ts` for reducer behavior.
-   `core/export/test/canvas-renderer.ts` for canvas export.
-   `react/components/test/cropper.tsx` for React cropper behavior.
-   `react/components/stencils/test/rectangle-stencil.tsx` for resize handles.
