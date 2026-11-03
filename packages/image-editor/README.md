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

`useCropperController` returns a controller with the current `state`, named setters, `reset`, `isDirty` and `getCroppedImage`. It does not provide undo and redo.

## API

### `Cropper`

Fills its parent container. Required props are `src` and `controller`. Common options include `freeformCrop`, `aspectRatio`, `showGrid`, `showDimming`, `showDimensions`, `onGestureStart` and `onGestureEnd`.

### `useCropperController( initialState? )`

React state hook for the cropper. Returns a `CropperController`: the current state, named setters, `reset`, `isDirty` and `getCroppedImage`.

### `buildModifiers( controller )`

The rotate, flip and crop instructions the WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) expects, in the order the server applies them.

### `DEFAULT_ASPECT_RATIOS`

The default aspect-ratio presets.

### `MAX_ZOOM`, `MAX_ROTATION_OFFSET`, `getMinZoom`

Limits for building your own zoom and rotation controls.

## More

-   [src/docs/architecture.md](src/docs/architecture.md)
-   [src/docs/recipes.md](src/docs/recipes.md)

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
