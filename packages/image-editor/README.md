# Image Editor

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

An image editor: a canvas where a person pans, zooms, rotates, flips and crops an image, and a helper that maps the result onto the original image for saving it. Cropping is the first thing it does. The media editor is built on it.

## Installation

Install the module

```bash
npm install @wordpress/image-editor --save
```

## Styles

The editor's styles ship in `build-style/style.css`. Load them in your stylesheet:

```scss
@use "@wordpress/image-editor/build-style/style.css";
```

The focus ring and the focused resize handle use the admin theme colour. Set `--wp-image-editor-focus-color` on an ancestor to change it.

## Quick Start

You keep the editor's state, and the controller hands you each change.

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
				freeformCrop
				showGrid="interactive"
			/>
		</div>
	);
}
```

## API

### `ImageEditorCanvas`

The canvas the person edits the image on. It fills its parent, so render it inside a sized element.

-   `src` (required): the image URL.
-   `controller` (required): the controller from `useImageEditor`.
-   `showGrid`: show the rule-of-thirds grid: `true`, `false` or `'interactive'` (only while the crop is being changed). Defaults to `false`.
-   `showDimming`: dim the image outside the crop area. Defaults to `true`.
-   `showDimensions`: show the crop size in pixels while resizing. Defaults to `true`.
-   `freeformCrop`: show resize handles so the crop area can be resized and moved. When `false` (the default), the crop area is fixed and centred, and the image pans and zooms under it.
-   `focusOnMount`: focus the crop area when it mounts. Defaults to `false`.
-   `disabled`: ignore all crop interaction, for example while saving, so the edit cannot change after saving starts. A gesture already in progress is cancelled. Defaults to `false`.
-   `onImageLoaded( size )`: called with the image's natural size when the image loads.
-   `onImageError()`: called when the image fails to load.
-   `onGestureStart()`: called when a drag, resize or pinch starts. Use it with `onGestureEnd` to record a gesture as one undo entry.
-   `onGestureEnd()`: called when a drag, resize or pinch ends.
-   `className`: an extra class for the container.

### `useImageEditor( { state, onChange } )`

React hook that returns the editor's controller. Pass the current state and a function that stores the next one. `onChange( nextState, { isEdit } )` gets `isEdit: false` for changes the person did not make, such as an image loading or the crop being refitted after a window resize, which usually should not get an undo entry.

The controller has:

-   `state`: the current state.
-   `setPan( { x, y } )`, `setZoom( zoom )`, `setRotation( degrees )`, `snapRotate90( 1 | -1 )`, `setFlip( { horizontal, vertical } )`, `toggleFlip( 'horizontal' | 'vertical' )`, `setCropRect( { x, y, width, height } )` and `setAspectRatio( ratio )` to change the edit. Positions and sizes are fractions from 0 to 1. `setAspectRatio( ratio )` reshapes the crop to the largest box of that ratio, and `setAspectRatio( undefined )` unlocks it.
-   `setImage( image )` to load an image. The canvas calls it when `src` loads. The first image keeps the state you started from, such as an edit you saved earlier. A different image replacing a loaded one starts fresh: no pan, zoom, rotation, flip or crop from the old image, but a locked ratio stays.
-   `reset()` to go back to the clean state, and `isDirty`, which is `true` when the person has changed anything since then. The clean state is the state you started from, as the editor settled it before the person made an edit: loading the image and fitting the crop to a locked ratio are not edits. `reset()` keeps a locked ratio.
-   `minZoom`, `maxZoom` and `maxRotationOffset`: the limits for building zoom and rotation controls. `minZoom` is the smallest zoom that still covers the crop area, so it changes with the edit.

### `ImageEditorState`, `createImageEditorState( image? )`

The editor's state, and the state an editor starts from for an image (or for no image yet). Read the state, store it and pass it back, but create it with `createImageEditorState` and change it only through the controller: it also carries values the editor keeps for itself.

### `areImageEditorStatesEqual( a, b )`

Whether two states describe the same edit, ignoring tiny floating-point differences. Use it to skip entries that change nothing in your own undo history.

### `mapEditToOriginal( state )`

Use it when saving. The editor's state describes what the canvas shows: where the image sits under the crop, how far it is zoomed, and a crop area measured against the view. Whatever saves the result, such as a server or an image library in the browser, works on the full-size original file and cannot use those values.

`mapEditToOriginal` maps the edit onto the original image: a list of flip, rotate and crop edits, in the order to apply them, so the saved image matches what the person framed. Crop positions and sizes are fractions of the image after the rotation. An unedited image returns an empty list, so you can skip saving.

## Not Yet Included

The first version covers what the media editor needs. Two additions are likely next, for simpler editors:

-   **A self-contained mode**, where `useImageEditor()` keeps the state itself. An editor without its own undo history would not need to store the state.
-   **Exporting the edited image in the browser** as a `Blob`. An editor that uploads the result, rather than asking a server to edit the original, would need it.

## More

-   [src/docs/architecture.md](src/docs/architecture.md)
-   [src/docs/recipes.md](src/docs/recipes.md)

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
