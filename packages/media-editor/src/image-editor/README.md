# Image Editor

> **Status: internal.** This module is not part of `@wordpress/media-editor`'s public API. Import it only from inside the media-editor package, through the local `../image-editor` barrel.

The image editor is the cropper engine used by the media editor:

-   **Core:** state, camera math, containment, source-region, transforms, and canvas export.
-   **React:** `<Cropper>`, `useCropperReducer`, and the optional `CropperProvider` / `useCropper` context wrapper.

`useCropperReducer` does not provide undo/redo. The media editor's composite state layer adds history and sidebar crop options on top of the cropper reducer.

## Quick Start

```tsx
import { Cropper, useCropperReducer } from '../image-editor';

function ImageCropper() {
	const controller = useCropperReducer();

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

`useCropperReducer` returns a controller object with the current `state`, named setters, `reset`, `isDirty`, and `getCroppedImage`.

## Internal APIs

### `Cropper`

Fills its parent container. Required props are `src` and `controller`. Common options include `freeformCrop`, `aspectRatio`, `showGrid`, `showDimming`, `showDimensions`, `onGestureStart`, and `onGestureEnd`.

### `useCropperReducer( initialState? )`

Pure React state hook for the cropper reducer. Returns a `CropperController`: current state, named setters, `reset`, `isDirty`, and `getCroppedImage`.

### `CropperProvider` / `useCropper`

Convenience context wrapper around `useCropperReducer` for component trees that need shared cropper state.

## Core Helpers

The local barrel also exposes helpers for reducer composition, source-region calculation, pipeline replay, and canvas export. Use named setters or `TransformOperation` values for normal state changes. Use reducer actions only when composing a controller such as `useMediaEditorState()`.

## Styles

Styles are bundled through the media-editor stylesheet. Classes use the `wp-media-editor-image-editor` prefix.

## More

-   [docs/architecture.md](docs/architecture.md)
-   [docs/recipes.md](docs/recipes.md)
