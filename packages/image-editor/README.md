# Image Editor

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

An image editor: a canvas where a person pans, zooms, rotates, flips and crops an image, and a helper that describes the edits to apply when saving it. Cropping is the first thing it does. The media editor is built on it.

This package replaces `@wordpress/image-cropper`, which is deprecated and will be removed in a later release.

## Installation

Install the module

```bash
npm install @wordpress/image-editor --save
```

## Styles

The canvas needs its stylesheet for layout. Load `build-style/style.css` from your app's Sass:

```scss
@use "@wordpress/image-editor/build-style/style.css";
```

Or import it from JavaScript:

```js
import '@wordpress/image-editor/build-style/style.css';
```

The canvas follows WordPress Design System colours and spacing when their tokens are present. A surrounding `ThemeProvider` can supply a light or dark palette. Gutenberg's media editor reads the user's admin colour scheme for its accent and currently uses a light surface. The built stylesheet also supplies standalone defaults when the tokens are absent. The grid stays translucent white because it sits over the image.

Set these CSS custom properties on a parent element or a class passed to `ImageEditorCanvas` through `className` to change its appearance without targeting its internal elements:

| Property                             | Changes                                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `--wp-image-editor-accent-color`     | Handle borders and keyboard focus colour. Defaults to the admin theme colour, or blue outside WordPress.         |
| `--wp-image-editor-foreground-color` | Crop outline at rest and dimensions tooltip text. The focused outline uses the accent colour.                    |
| `--wp-image-editor-surface-color`    | Handle fill, dimensions tooltip background and the inner focus ring.                                             |
| `--wp-image-editor-dimming-color`    | Colour outside the crop. During a drag, the same colour is used at two-thirds opacity.                           |
| `--wp-image-editor-grid-color`       | Rule-of-thirds lines.                                                                                            |
| `--wp-image-editor-canvas-inset`     | Space around the editing surface. Defaults to 24px and cannot go below 22px, so resize handles remain reachable. |

For example, `<ImageEditorCanvas className="my-cropper" ... />` can use:

```css
.my-cropper {
	--wp-image-editor-accent-color: rebeccapurple;
}

.my-cropper.is-dark {
	--wp-image-editor-foreground-color: #f0f0f0;
	--wp-image-editor-surface-color: #1e1e1e;
	--wp-image-editor-dimming-color: rgb( 0 0 0 / 60% );
}
```

To use the design tokens outside WordPress, install `@wordpress/theme` and load its `design-tokens.css` in your app. The image editor runs without it, and your custom properties take precedence over the design tokens.

## Outside WordPress

The package needs no WordPress site, and nothing it imports talks to one. Two things to know:

-   The examples import React hooks from `@wordpress/element`, which re-exports React. Import them from `react` instead if you prefer.
-   The editor's own text, such as the labels on the resize handles and what a screen reader announces, is in English unless you give `@wordpress/i18n` your translations.

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
-   `freeformCrop`: show resize handles so the crop area can be resized and moved. Defaults to `true`. When `false`, the crop area is fixed and centred, and the image pans and zooms under it.
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
-   `setPan( { x, y } )`, `setZoom( zoom )`, `setRotation( degrees )`, `snapRotate90( 1 | -1 )`, `setFlip( { horizontal, vertical } )`, `toggleFlip( 'horizontal' | 'vertical' )`, `setCropRect( { x, y, width, height } )` and `setAspectRatio( ratio )` to change the edit. The crop area is in fractions of the view, from 0 to 1. The pan is an offset from the centre, so it is signed, and how far it can go depends on the zoom and the crop, because the image has to cover the crop. `setAspectRatio( ratio )` reshapes the crop to the largest box of that ratio, and `setAspectRatio( undefined )` unlocks it. While a ratio is locked, the crop always has that ratio: a crop that does not match, from `setCropRect` or a state you pass in, keeps its centre and width and takes the height the ratio needs.
-   `setImage( image )` to load an image. The canvas calls it when `src` loads. The first image keeps the state you started from, such as an edit you saved earlier. Replacing or clearing a loaded image starts fresh: no pan, zoom, rotation, flip or crop from the old image, but a locked ratio stays.
-   `reset()` to go back to the clean state, and `isDirty`, which is `true` when the pan, zoom, rotation, flip or crop differs from that state. The clean state is the state you started from, as the editor settled it before the person made an edit: loading the image and fitting the crop to a locked ratio are not edits. So `reset()` keeps a locked ratio only when the state you started from had one; a ratio locked later is an edit, and reset undoes it along with the rest. Locking a ratio usually makes the edit dirty, because it reshapes the crop. Unlocking does not, and nor does locking a ratio the crop already has.
-   `minZoom`, `maxZoom` and `maxRotationOffset`: the limits for building zoom and rotation controls. `minZoom` is the smallest zoom that still covers the crop area, so it changes with the edit.

### `ImageEditorState`, `createImageEditorState( options? )`

The editor's state, and the state an editor starts from. Pass `image` when you already have one, and `aspectRatio` to lock the crop from the start; both are optional. Read the state, store it and pass it back, but create it with `createImageEditorState` and change it only through the controller: it also carries values the editor keeps for itself.

### `areImageEditorStatesEqual( a, b )`

Whether two states have the same public edit fields, ignoring tiny floating-point differences. The values the editor keeps for later rotations do not count. Use it to skip entries that change nothing in your own undo history.

### `getOutputSize( state )`

The dimensions that the edits from `mapEditToOriginal` would produce on the image in `state.image`. A nearly full crop that the mapper omits gives the full image dimensions. Use this for a size readout or a minimum-size check against the loaded image. A processor that edits a different file or rounds pixels may produce different dimensions. Returns `null` when no image has loaded.

### `mapEditToOriginal( state )`

Use it when saving. The editor stores where the image sits, how far it is zoomed, and a crop area measured against the view. `mapEditToOriginal` turns that state into operations for the full-size image loaded in `state.image`. Here, "original" means the image loaded into this editor, even if that file was edited before.

The returned list contains flip, rotate and crop operations as needed, in the order to apply them. Crop positions and sizes are fractions of the image after rotation. An empty list means no image has loaded or there is no flip, rotation or crop to apply. A locked ratio can produce a crop operation before the person edits anything. The caller applies the operations and saves the result.

### `exportImage( state, options? )`

Use it when the edited image is uploaded as a new file, rather than applied to the original by a server. It loads the image in `state.image`, draws the region the crop frames with the flip, rotation and zoom applied, and resolves with a `Blob` whose dimensions are the ones `getOutputSize( state )` reports. `options.type` is the MIME type, `image/png` by default, and `options.quality` is the quality for lossy types, from 0 to 1.

It runs only in a browser. It rejects when no image has loaded, when the image fails to load, or when the browser refuses to read the canvas: the image is loaded with `crossOrigin` set to `anonymous`, so a source on another origin needs CORS headers.

## Not Yet Included

The first version covers what the media editor needs. One addition is likely next, for simpler editors:

-   **A self-contained mode**, where `useImageEditor()` keeps the state itself. An editor without its own undo history would not need to store the state.

## More

-   [Architecture](/packages/image-editor/docs/architecture.md)
-   [Recipes](/packages/image-editor/docs/recipes.md)

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
