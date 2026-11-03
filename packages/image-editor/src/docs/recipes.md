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

## Offer Aspect-Ratio Presets

The controller takes a width / height ratio, or `undefined` for a free crop. Keep your own list of presets, and keep the selected one in your own state. To offer the image's own ratio, work it out from `controller.state.image`.

```tsx
import { useState } from '@wordpress/element';
import { Cropper, useCropperController } from '@wordpress/image-editor';

const PRESETS = [
	{ label: 'Free', value: 'free' },
	{ label: 'Original', value: 'original' },
	{ label: 'Square', value: '1' },
	{ label: 'Landscape (16:9)', value: String( 16 / 9 ) },
];

function CropperWithPresets( { src }: { src: string } ) {
	const controller = useCropperController();
	const [ preset, setPreset ] = useState( 'free' );
	const { image } = controller.state;

	return (
		<>
			<select
				value={ preset }
				onChange={ ( event ) => {
					const { value } = event.target;
					setPreset( value );
					if ( value === 'free' ) {
						controller.setAspectRatio( undefined );
					} else if ( value === 'original' ) {
						controller.setAspectRatio(
							image
								? image.naturalWidth / image.naturalHeight
								: undefined
						);
					} else {
						controller.setAspectRatio( parseFloat( value ) );
					}
				} }
			>
				{ PRESETS.map( ( { label, value } ) => (
					<option key={ value } value={ value }>
						{ label }
					</option>
				) ) }
			</select>
			<Cropper src={ src } controller={ controller } freeformCrop />
		</>
	);
}
```

## Lock the Crop to a Ratio

For a fixed shape, such as a square site icon, start with a locked ratio and leave out `freeformCrop`. The crop area stays centred at the largest square that fits, and the person pans and zooms the image under it.

```tsx
const controller = useCropperController( {
	initialState: { aspectRatio: 1 },
} );

return <Cropper src={ src } controller={ controller } />;
```

## Start From a Saved Crop

Pass a crop you saved earlier from `controller.state` as `initialState`. It is kept when the image loads.

```tsx
const controller = useCropperController( { initialState: savedCrop } );
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

## Save the Edit

`getStepsForOriginal( state )` returns the flip, rotate and crop steps that make the full-size original image match what the person framed, in the order to apply them. Crop positions and sizes are fractions of the image after the rotation. An unedited image returns an empty list, so you can skip saving.

The WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) applies `modifiers` in the same order, with the crop in percentages:

```ts
import apiFetch from '@wordpress/api-fetch';
import { getStepsForOriginal } from '@wordpress/image-editor';

const modifiers = getStepsForOriginal( controller.state ).map( ( step ) => {
	if ( step.type === 'flip' ) {
		return {
			type: 'flip',
			args: {
				flip: { horizontal: step.horizontal, vertical: step.vertical },
			},
		};
	}
	if ( step.type === 'rotate' ) {
		return { type: 'rotate', args: { angle: step.angle } };
	}
	return {
		type: 'crop',
		args: {
			left: step.x * 100,
			top: step.y * 100,
			width: step.width * 100,
			height: step.height * 100,
		},
	};
} );

if ( modifiers.length ) {
	await apiFetch( {
		path: `/wp/v2/media/${ attachmentId }/edit`,
		method: 'POST',
		data: { src: imageUrl, modifiers },
	} );
}
```

## Accessibility Notes

-   The crop area is focusable and keyboard-operable, and changes are announced through an ARIA live region.
-   Arrow keys pan the image. Hold Shift for bigger steps.
-   `+` or `=` zooms in, and `-` or `_` zooms out.
-   `R` rotates 90 degrees clockwise, and Shift+`R` rotates counter-clockwise.
-   `H` flips horizontally, and `V` flips vertically.
-   With `freeformCrop`, the resize handles are buttons. Arrow keys resize from the focused handle; hold Shift for bigger steps.
