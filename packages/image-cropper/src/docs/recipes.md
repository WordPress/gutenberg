# Cropper Recipes

> **Status: experimental.** This API may change in any release.

## Mount a Cropper

```tsx
import { Cropper, useCropperController } from '@wordpress/image-cropper';

function ImageCropper( { src }: { src: string } ) {
	const controller = useCropperController();

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
	const controller = useCropperController();
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

When controls are split across components, use `CropperProvider`.

```tsx
import { Cropper, CropperProvider, useCropper } from '@wordpress/image-cropper';

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

## Get Source Coordinates

Use source-region helpers when saving crop data instead of rendering a `Blob`.

```ts
import { getSourceRegion, getSourceRegionPercent } from '@wordpress/image-cropper';

const imageSize = { width: naturalWidth, height: naturalHeight };
const region = getSourceRegion( controller.state, imageSize );
const percent = getSourceRegionPercent( controller.state, imageSize );
```

`getSourceRegionPercent()` matches the crop data shape used by the WordPress attachments `/edit` endpoint.

## Export a Cropped Image

```ts
const blob = await controller.getCroppedImage( 'image/jpeg', 0.9 );
```

Canvas export is browser-only. Cross-origin images need valid CORS headers or the canvas will be tainted.

## Send the Crop to WordPress

`buildModifiers()` turns the controller's crop into the rotate, flip and crop instructions the WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) expects, in the order the server applies them.

```ts
import apiFetch from '@wordpress/api-fetch';
import { buildModifiers } from '@wordpress/image-cropper';

const modifiers = buildModifiers( controller );
if ( modifiers.length ) {
	await apiFetch( {
		path: `/wp/v2/media/${ attachmentId }/edit`,
		method: 'POST',
		data: { src: imageUrl, modifiers },
	} );
}
```

An unedited image returns an empty list.

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
npm run test:unit -- packages/image-cropper
```

Useful test areas:

-   `src/core/test/camera.ts` for containment and camera invariants.
-   `src/core/test/state.ts` for reducer behavior.
-   `src/core/export/test/canvas-renderer.jsdom.test.ts` for canvas export.
-   `src/react/components/test/cropper.browser.test.tsx` for React cropper behavior.
-   `src/react/components/stencils/test/rectangle-stencil.browser.test.tsx` for resize handles.
-   `src/test/build-modifiers.test.ts` for the server instructions.
