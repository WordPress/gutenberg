# Image Editor Recipes

> **Status: experimental.** This API may change in any release.

## Mount the Canvas

Keep the editor's state in your own state, and pass it to `useImageEditor` with a function that stores the next one.

```tsx
import { useState } from '@wordpress/element';
import {
	ImageEditorCanvas,
	createImageEditorState,
	useImageEditor,
} from '@wordpress/image-editor';

function MyImageEditor( { src }: { src: string } ) {
	const [ state, setState ] = useState( () => createImageEditorState() );
	const controller = useImageEditor( { state, onChange: setState } );

	return (
		<div style={ { width: 600, height: 400 } }>
			<ImageEditorCanvas
				src={ src }
				controller={ controller }
				showGrid="interactive"
			/>
		</div>
	);
}
```

The canvas fills its parent. Always render it inside a sized container. The canvas loads the image into the state itself, through the controller.

## Add Controls

Read the limits from the controller, so your controls stop where the editor does.

```tsx
const { state, setZoom, snapRotate90, toggleFlip, reset } = controller;

return (
	<>
		<button
			disabled={ state.zoom >= controller.maxZoom }
			onClick={ () =>
				setZoom( Math.min( controller.maxZoom, state.zoom + 0.5 ) )
			}
		>
			Zoom in
		</button>
		<button onClick={ () => snapRotate90( 1 ) }>Rotate right</button>
		<button onClick={ () => toggleFlip( 'horizontal' ) }>
			Flip horizontal
		</button>
		<button onClick={ () => reset() } disabled={ ! controller.isDirty }>
			Reset
		</button>
		<ImageEditorCanvas src={ src } controller={ controller } />
	</>
);
```

## Offer Aspect-Ratio Presets

The controller takes a width / height ratio, or `undefined` for a free crop. Keep your own list of presets, and keep the selected one in your own state. To offer the image's own ratio, work it out from `controller.state.image`.

```tsx
const PRESETS = [
	{ label: 'Free', value: 'free' },
	{ label: 'Original', value: 'original' },
	{ label: 'Square', value: '1' },
	{ label: 'Landscape (16:9)', value: String( 16 / 9 ) },
];

function PresetPicker( { controller }: { controller: ImageEditorController } ) {
	const [ preset, setPreset ] = useState( 'free' );
	const { image } = controller.state;

	return (
		<select
			value={ preset }
			onChange={ ( event ) => {
				const { value } = event.target;
				setPreset( value );
				if ( value === 'free' ) {
					controller.setAspectRatio( undefined );
				} else if ( value === 'original' ) {
					controller.setAspectRatio(
						image ? image.naturalWidth / image.naturalHeight : undefined
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
	);
}
```

## Lock the Crop to a Ratio

For a fixed shape, such as a square site icon, start from a state with a locked ratio and pass `freeformCrop={ false }`. The crop stays the largest square that fits, centred, while the person pans and zooms the image under it.

Leave `freeformCrop` at its default to let them move and resize the crop instead. The locked ratio holds either way.

Pass the image too if you have it, so the crop starts the right shape rather than waiting for the canvas to fit it.

```tsx
const [ state, setState ] = useState( () =>
	createImageEditorState( { aspectRatio: 1 } )
);
const controller = useImageEditor( { state, onChange: setState } );

return (
	<ImageEditorCanvas
		src={ src }
		controller={ controller }
		freeformCrop={ false }
	/>
);
```

## Start From a Saved Edit

Store the whole state object, and start from it next time. It is kept when the image loads.

```tsx
const [ state, setState ] = useState< ImageEditorState >( () => savedState );
```

## Keep an Undo History

Because you keep the state, you can keep earlier states too. A minimal history, with a drag recorded as one entry:

```tsx
import { useRef, useState } from '@wordpress/element';
import {
	ImageEditorCanvas,
	areImageEditorStatesEqual,
	createImageEditorState,
	useImageEditor,
	type ImageEditorState,
} from '@wordpress/image-editor';

function ImageEditorWithHistory( { src }: { src: string } ) {
	const [ state, setState ] = useState( () => createImageEditorState() );
	const [ past, setPast ] = useState< ImageEditorState[] >( [] );
	const gestureStart = useRef< ImageEditorState | null >( null );

	const controller = useImageEditor( {
		state,
		onChange: ( next, { isEdit } ) => {
			if ( isEdit && ! gestureStart.current ) {
				setPast( ( entries ) => [ ...entries, state ] );
			}
			setState( next );
		},
	} );

	return (
		<>
			<button
				disabled={ ! past.length }
				onClick={ () => {
					setState( past[ past.length - 1 ] );
					setPast( past.slice( 0, -1 ) );
				} }
			>
				Undo
			</button>
			<ImageEditorCanvas
				src={ src }
				controller={ controller }
				onGestureStart={ () => {
					gestureStart.current = state;
				} }
				onGestureEnd={ () => {
					const start = gestureStart.current;
					gestureStart.current = null;
					if ( start && ! areImageEditorStatesEqual( start, state ) ) {
						setPast( ( entries ) => [ ...entries, start ] );
					}
				} }
			/>
		</>
	);
}
```

`isEdit` is `false` for an image loading or the crop being refitted after a window resize, so those do not get an undo entry. The media editor's session (`packages/media-editor/src/state`) is a fuller version of this, with redo and other edits in the same history.

## Save the Edit

The editor's state stores pan, zoom, rotation, flip and the crop area used by the canvas. `mapEditToImage( state )` turns that state into flip, rotate and crop edits for the full-size image loaded in `state.image`, in the order to apply them. That image may itself be a file someone edited before; the edits apply to it as it is. Crop positions and sizes are fractions of the image after rotation. An empty list means no image has loaded or there is no flip, rotation or crop to apply. A crop fitted to a locked ratio can produce an operation before the person edits anything. Apply the operations to the loaded image to save what the person framed.

The WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) applies `modifiers` in the same order, with the crop in percentages:

```ts
import apiFetch from '@wordpress/api-fetch';
import { mapEditToImage } from '@wordpress/image-editor';

const modifiers = mapEditToImage( controller.state ).map( ( edit ) => {
	if ( edit.type === 'flip' ) {
		return {
			type: 'flip',
			args: {
				flip: { horizontal: edit.horizontal, vertical: edit.vertical },
			},
		};
	}
	if ( edit.type === 'rotate' ) {
		return { type: 'rotate', args: { angle: edit.angle } };
	}
	return {
		type: 'crop',
		args: {
			left: edit.x * 100,
			top: edit.y * 100,
			width: edit.width * 100,
			height: edit.height * 100,
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

An editor that uploads the result as a new file, rather than asking the server to edit the original, exports it in the browser instead. `exportImage( state, options? )` resolves with a `Blob` of the framed region at the size `getOutputSize( state )` reports:

```ts
import { exportImage } from '@wordpress/image-editor';

const file = await exportImage( controller.state, {
	type: 'image/jpeg',
	quality: 0.9,
} );
```

## Accessibility Notes

-   The crop area is focusable and keyboard-operable, and changes are announced through an ARIA live region.
-   Arrow keys pan the image. Hold Shift for bigger steps.
-   `+` or `=` zooms in, and `-` or `_` zooms out.
-   `R` rotates 90 degrees clockwise, and Shift+`R` rotates counter-clockwise.
-   `H` flips horizontally, and `V` flips vertically.
-   With resize handles (the default), each handle is a button. Arrow keys resize from the focused handle; hold Shift for bigger steps.
