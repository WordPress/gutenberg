# Image Editor

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

An image cropper with pan, zoom, rotation, flip and a resizable crop area, and a helper to send the result to WordPress. The media editor is built on it.

## Installation

Install the module

```bash
npm install @wordpress/image-editor --save
```

## Styles

The cropper's styles ship in `build-style/style.css`. Load them in your stylesheet:

```scss
@use "@wordpress/image-editor/build-style/style.css";
```

The focus ring and the focused resize handle use the admin theme colour. Set `--wp-image-editor-focus-color` on an ancestor to change it.

## Quick Start

```tsx
import { Cropper, useCropperController } from '@wordpress/image-editor';

function ImageCropper() {
	const controller = useCropperController();

	return (
		<div style={ { width: 600, height: 400 } }>
			<Cropper
				src="https://example.com/photo.jpg"
				controller={ controller }
				freeformCrop
				showDimming
				showGrid="interactive"
			/>
		</div>
	);
}
```

`useCropperController` returns a controller with the current `state`, named setters, `reset`, `isDirty` and `getCroppedImage`. It keeps no undo history; to add one, keep the state yourself (see below).

## API

### `Cropper`

The crop canvas. It fills its parent container, so render it inside a sized element.

-   `src` (required): the image URL.
-   `controller` (required): the controller from `useCropperController`.
-   `freeformCrop`: show resize handles so the crop area can be resized and moved. When `false` (the default), the crop area is fixed and centred, and the image pans and zooms under it.
-   `showGrid`: show the rule-of-thirds grid, `true`, `false` or `'interactive'` (only while the crop is being changed).
-   `showDimming`: dim the image outside the crop area. Defaults to `true`.
-   `showDimensions`: show the crop size in pixels while resizing. Defaults to `true`.
-   `minZoom`, `maxZoom`: zoom limits. The minimum defaults to the smallest zoom that still covers the crop area.
-   `focusOnMount`: focus the crop area when it mounts.
-   `disabled`: ignore all crop interaction, for example while saving.
-   `onImageLoaded( size )`, `onImageError()`: called when the image loads or fails to load.
-   `onGestureStart()`, `onGestureEnd()`: called when a drag, resize or pinch starts and ends. Use them to record a gesture as one undo entry.
-   `className`: an extra class for the container.

### `useCropperController( options? )`

React hook for the cropper. Returns a `CropperController`: the current state, named setters, `reset`, `isDirty` and `getCroppedImage`. Lock the crop to a ratio with `controller.setAspectRatio( ratio )`, or unlock it with `undefined`; the ratio lives in `controller.state.aspectRatio`, and `<Cropper>` reads it from there.

The controller has:

-   `state`: the current crop. Treat it as opaque: read it, store it and pass it back, but change it only through the controller.
-   `setZoom( zoom )`, `setRotation( degrees )`, `snapRotate90( 1 | -1 )`, `setFlip( { horizontal, vertical } )`, `toggleFlip( 'horizontal' | 'vertical' )`, `setPan( { x, y } )`, `setCropRect( { x, y, width, height } )` and `setAspectRatio( ratio )` to change the crop. Positions and sizes are fractions of the image, from 0 to 1.
-   `setImage( image )` to load an image, `reset()` to start over, and `isDirty`, which is `true` when the crop differs from where it started.
-   `getCroppedImage( mimeType?, quality? )`, which draws the crop to a canvas and returns a `Blob`. The image must be served with cross-origin (CORS) headers.

`setVisualSize`, `adjustCropRectForViewport`, `settleCrop` and `setZoomAtPoint` are for `<Cropper>` itself; you do not need to call them.

With no options, the controller keeps its own state (pass `initialState` to start from something other than the default). To keep the state yourself, for example in an editor's own undo history, pass `state` and `onChange`. The controller works out each change and calls `onChange( nextState, { isEdit } )`. `isEdit` is `false` for changes the person did not make, such as an image loading or the crop being refitted after a window resize, which usually should not get an undo entry. Use `onGestureStart` and `onGestureEnd` on `<Cropper>` to group a drag into one undo entry.

### `createCropperState( image? )`

The state a cropper starts from for an image. Use it to build your starting state when you keep the state yourself.

### `areCropperStatesEqual( a, b )`

Whether two cropper states are the same crop, ignoring tiny floating-point differences. Use it to skip no-op entries in your own undo history.

### `buildModifiers( controller )`

The rotate, flip and crop instructions the WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) expects, in the order the server applies them.

### `DEFAULT_ASPECT_RATIOS`, `resolveAspectRatio( presetKey, image )`

The default aspect-ratio presets, and a function that turns a preset value into the ratio to pass to `controller.setAspectRatio`, resolving "Original" from the loaded image.

### `MAX_ZOOM`, `MAX_ROTATION_OFFSET`, `getMinZoom`

Limits for building your own zoom and rotation controls.

## More

-   [src/docs/architecture.md](src/docs/architecture.md)
-   [src/docs/recipes.md](src/docs/recipes.md)

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
