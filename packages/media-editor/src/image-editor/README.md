# Image Editor

> **Status: private.** This module is not part of `@wordpress/media-editor`'s public API. Inside the package, import it from the `../image-editor` folder. A small part of it is also available to other packages through the package's private API; see [Private API](#private-api).

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

## Private API

Packages that are allowed to use private APIs can unlock these from the `privateApis` export of `@wordpress/media-editor`: `Cropper`, `useCropperController`, `getSourceRegion`, `getSourceRegionPercent` and `buildModifiers`. Everything else in this module, including `CropperProvider` and `useCropper`, stays internal for now. Private APIs can change without notice.

`buildModifiers( controller )` turns the controller's current edit into the list of flip, rotate and crop instructions that the media REST endpoint (`/wp/v2/media/<id>/edit`) applies on the server. It returns an empty list when nothing needs changing or no image has loaded.

```tsx
import apiFetch from '@wordpress/api-fetch';
import { privateApis as mediaEditorPrivateApis } from '@wordpress/media-editor';
import { unlock } from './lock-unlock'; // The package's own private API opt-in.

const { Cropper, useCropperController, buildModifiers } = unlock(
	mediaEditorPrivateApis
);

function CropImage( { attachmentId, src } ) {
	const controller = useCropperController();

	const save = async () => {
		const modifiers = buildModifiers( controller );
		if ( modifiers.length ) {
			await apiFetch( {
				path: `/wp/v2/media/${ attachmentId }/edit`,
				method: 'POST',
				data: { src, modifiers },
			} );
		}
	};

	return (
		<>
			<div style={ { width: 600, height: 400 } }>
				<Cropper src={ src } controller={ controller } freeformCrop />
			</div>
			<button onClick={ () => controller.toggleFlip( 'horizontal' ) }>
				Flip
			</button>
			<button onClick={ save }>Save</button>
		</>
	);
}
```

## Styles

Styles are bundled through the media-editor stylesheet. Classes use the `wp-media-editor-image-editor` prefix.

## More

-   [docs/architecture.md](docs/architecture.md)
-   [docs/recipes.md](docs/recipes.md)
