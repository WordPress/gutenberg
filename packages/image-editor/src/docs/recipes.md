# Image Editor Recipes

> **Status: experimental.** This API may change in any release.

## Mount a Cropper

```tsx
import { Cropper, useCropperController } from '@wordpress/image-editor';

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

## Keep the State Yourself

To put the crop in your own undo history, alongside anything else your editor changes, keep the cropper state in your own state and pass it to the controller. The controller works out each change and hands you the next state. A minimal history, with a drag recorded as one entry:

```tsx
import { useRef, useState } from '@wordpress/element';
import {
	Cropper,
	areCropperStatesEqual,
	createCropperState,
	useCropperController,
	type CropperState,
} from '@wordpress/image-editor';

function CropperWithHistory( { src }: { src: string } ) {
	const [ crop, setCrop ] = useState( () => createCropperState() );
	const [ past, setPast ] = useState< CropperState[] >( [] );
	const gestureStart = useRef< CropperState | null >( null );

	const controller = useCropperController( {
		state: crop,
		onChange: ( next, { isEdit } ) => {
			if ( isEdit && ! gestureStart.current ) {
				setPast( ( entries ) => [ ...entries, crop ] );
			}
			setCrop( next );
		},
	} );

	return (
		<>
			<button
				disabled={ ! past.length }
				onClick={ () => {
					setCrop( past[ past.length - 1 ] );
					setPast( past.slice( 0, -1 ) );
				} }
			>
				Undo
			</button>
			<Cropper
				src={ src }
				controller={ controller }
				freeformCrop
				onGestureStart={ () => {
					gestureStart.current = crop;
				} }
				onGestureEnd={ () => {
					const start = gestureStart.current;
					gestureStart.current = null;
					if ( start && ! areCropperStatesEqual( start, crop ) ) {
						setPast( ( entries ) => [ ...entries, start ] );
					}
				} }
			/>
		</>
	);
}
```

`isEdit` is `false` for an image loading or the crop being refitted after a window resize, so those do not get an undo entry. The media editor's session (`packages/media-editor/src/state`) is a fuller version of this, with redo and other edits in the same history.

## Export a Cropped Image

```ts
const blob = await controller.getCroppedImage( 'image/jpeg', 0.9 );
```

Canvas export is browser-only. Cross-origin images need valid CORS headers or the canvas will be tainted.

## Send the Crop to WordPress

`buildModifiers()` turns the controller's crop into the rotate, flip and crop instructions the WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) expects, in the order the server applies them.

```ts
import apiFetch from '@wordpress/api-fetch';
import { buildModifiers } from '@wordpress/image-editor';

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
npm run test:unit -- packages/image-editor
```

Useful test areas:

-   `src/core/test/camera.ts` for containment and camera invariants.
-   `src/core/test/state.ts` for reducer behavior.
-   `src/core/export/test/canvas-renderer.jsdom.test.ts` for canvas export.
-   `src/react/components/test/cropper.browser.test.tsx` for React cropper behavior.
-   `src/react/components/stencils/test/rectangle-stencil.browser.test.tsx` for resize handles.
-   `src/react/hooks/test/use-cropper-controller.jsdom.test.ts` for the controller, including keeping the state yourself.
-   `src/test/build-modifiers.test.ts` for the server instructions.
