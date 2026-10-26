# Image Editor

> **Status: internal.** This module is not part of `@wordpress/media-editor`'s public API. Import it only from inside the media-editor package, through the local `../image-editor` barrel.

The image editor is the cropper engine used by the media editor:

-   **Core:** state, camera math, containment, source-region, transforms, and canvas export.
-   **React:** `<Cropper>`, `useCropperController`, and the optional `CropperProvider` / `useCropper` context wrapper.

`useCropperController` does not provide undo/redo. The media editor's composite state layer adds history and sidebar crop options on top of the cropper reducer, importing the reducer-level helpers from `image-editor/core` directly.

## Quick Start

```tsx
import { Cropper, useCropperController } from '../image-editor';

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

`useCropperController` returns a controller object with the current `state`, named setters, `reset`, `isDirty`, and `getCroppedImage`.

## Internal APIs

### `Cropper`

Fills its parent container. Required props are `src` and `controller`. Common options include `freeformCrop`, `aspectRatio`, `showGrid`, `showDimming`, `showDimensions`, `onGestureStart`, and `onGestureEnd`.

### `useCropperController( initialState? )`

Pure React state hook for the cropper reducer. Returns a `CropperController`: current state, named setters, `reset`, `isDirty`, and `getCroppedImage`.

### `CropperProvider` / `useCropper`

Convenience context wrapper around `useCropperController` for component trees that need shared cropper state.

## Core Helpers

`index.ts` also exports helpers for source-region calculation, pipeline replay, and canvas export. Use the named setters or `TransformOperation` values for state changes. The reducer-level helpers that `useMediaEditorState()` composes the cropper with are imported from `core` directly and are not part of this index.

## Styles

Styles are bundled through the media-editor stylesheet. Classes use the `wp-media-editor-image-editor` prefix.

## More

-   [docs/architecture.md](docs/architecture.md)
-   [docs/recipes.md](docs/recipes.md)
