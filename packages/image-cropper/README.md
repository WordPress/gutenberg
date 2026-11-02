# Image Cropper

An image cropper with pan, zoom, rotation, flip and a resizable crop area, and helpers to send the result to WordPress.

<div class="callout callout-alert">
The `Cropper` API is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

## Installation

Install the module

```bash
npm install @wordpress/image-cropper --save
```

## Styles

The cropper's styles ship in `build-style/style.css`. Load them in your stylesheet:

```scss
@use "@wordpress/image-cropper/build-style/style.css";
```

## Quick Start

```tsx
import { Cropper, useCropperController } from '@wordpress/image-cropper';

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

### `CropperProvider` / `useCropper`

A context wrapper around `useCropperController` for component trees that share one cropper.

### `getSourceRegion` / `getSourceRegionPercent`

Where the crop lands in the source image, in pixels or in percentages.

### `buildModifiers( controller )`

The rotate, flip and crop instructions the WordPress media REST endpoint (`/wp/v2/media/<id>/edit`) expects, in the order the server applies them.

### `exportCroppedImage`

Draws the crop to a canvas and returns a `Blob`. The image must be served with cross-origin (CORS) headers.

### `DEFAULT_ASPECT_RATIOS`, `ORIGINAL_ASPECT_RATIO`

The default aspect-ratio presets, and the preset value that means "the image's own ratio".

### `MAX_ZOOM`, `MAX_ROTATION_OFFSET`, `getMinZoom`

Limits for building your own zoom and rotation controls.

## More

-   [src/docs/architecture.md](src/docs/architecture.md)
-   [src/docs/recipes.md](src/docs/recipes.md)

## Deprecated: `ImageCropper`

`ImageCropper`, `ImageCropperProvider`, `useImageCropper` and `normalizeRotation` are deprecated. They are built on [react-easy-crop](https://www.npmjs.com/package/react-easy-crop) and will be rebuilt on `Cropper`, then removed. New code should use `Cropper`.

### Current features

- **Image Cropping**: Interactive aspect ratio-based crop area with drag and resize functionality
- **Rotation**: Rotate images in 90-degree increments
- **Zoom Control**: Zoom in/out with configurable min/max limits
- **Aspect Ratio**: Set and maintain specific aspect ratios
- **Flip Controls**: Horizontal and vertical image flipping
- **State Management**: Centralized state management with React Context
- **Custom Reset State**: Configure custom initial states for reset operations

### Future features

- [ ] Freeform cropping

### API

#### Components

- `ImageCropper` - The main cropping component that provides the cropping canvas.

```tsx
interface ImageCropperProps {
	src: string; // Image source URL
	onLoad?: ( mediaSize: MediaSize ) => void; // Callback when image loads with media dimensions
	minZoom?: number; // Minimum zoom level (default: 1)
	maxZoom?: number; // Maximum zoom level (default: 5)
}
```

- `ImageCropperProvider` - Context provider for state management. This component implements the React Context pattern to share cropper state across your application. It manages all internal cropper state including crop position, zoom levels, rotation, flip transformations, aspect ratios, and media dimensions. Any component that needs to read or modify cropper state must be a descendant of this provider. The provider also handles state persistence and provides methods for resetting to custom initial states.

#### Hooks

- `useImageCropper` - Provides access to all cropper state and methods.

```tsx
import { useImageCropper } from '@wordpress/image-cropper';

const {
	// Unified state object
	cropperState, // Complete cropper state { crop, croppedArea, croppedAreaPixels, zoom, rotation, aspectRatio, flip, mediaSize }
	setCropperState, // Set multiple state properties at once

	// Actions
	reset, // Reset all changes (uses resetState if set)
	setResetState, // Set custom reset state
	getCroppedImage, // Get cropped image as data URL

	// Reset state
	resetState, // Current reset state configuration
	isDirty, // Whether the state is dirty based on resetState or default settings
} = useImageCropper();
```

#### Types

- `ImageCropperState` - State interface for cropper data
- `ImageCropperProps` - Props interface for ImageCropper component
- `ImageCropperContextValue` - Context value interface
- `Flip` - Flip state interface
- `Point`, `Area`, `MediaSize` - Re-exported from react-easy-crop

#### Utilities

- `normalizeRotation` - Utility function to normalize rotation values to 0-360 degrees

```tsx
import { normalizeRotation } from '@wordpress/image-cropper';

const normalized = normalizeRotation( -90 ); // Returns 270
const normalized2 = normalizeRotation( 450 ); // Returns 90
```

### Usage

#### Basic Implementation

The image cropper provides the core cropping functionality without any built-in UI controls. You must implement your own tools using the `useImageCropper` hook.

```tsx
import {
	ImageCropper,
	ImageCropperProvider,
	useImageCropper,
} from '@wordpress/image-cropper';

function ImageEditor() {
	return (
		<ImageCropperProvider>
			<div className="image-editor">
				<ImageCropper
					src="https://example.com/image.jpg"
					className="image-cropper"
					onLoad={ ( mediaSize ) =>
						console.log( 'Image loaded', mediaSize )
					}
				/>
				<ImageEditorTools />
			</div>
		</ImageCropperProvider>
	);
}

function ImageEditorTools() {
	const { cropperState, setCropperState, reset, setResetState } =
		useImageCropper();

	const { zoom, rotation, aspectRatio, flip, mediaSize, croppedArea } =
		cropperState;

	const handleSave = () => {
		console.log( 'Cropper state:', {
			crop: croppedArea,
			zoom,
			rotation,
			aspectRatio,
			flip,
		} );
		// Apply the crop state to your image
	};

	return (
		<div className="image-editor-tools">
			<button
				onClick={ () => setCropperState( { rotation: rotation + 90 } ) }
			>
				Rotate Right
			</button>
			<button
				onClick={ () => setCropperState( { rotation: rotation - 90 } ) }
			>
				Rotate Left
			</button>
			<button
				onClick={ () =>
					setCropperState( {
						flip: { ...flip, horizontal: ! flip.horizontal },
					} )
				}
			>
				Flip Horizontal
			</button>
			<button
				onClick={ () =>
					setCropperState( {
						flip: { ...flip, vertical: ! flip.vertical },
					} )
				}
			>
				Flip Vertical
			</button>
			<button onClick={ handleSave }>Apply Changes</button>
			<button onClick={ reset }>Reset</button>
		</div>
	);
}
```

#### Advanced Usage with Custom Reset State

You can configure a custom initial state that will be used when the reset function is called:

```tsx
function ImageEditorWithCustomReset() {
	const { setResetState, reset } = useImageCropper();

	// Set custom reset state
	useEffect( () => {
		setResetState( {
			rotation: 90,
			zoom: 1.5,
			aspectRatio: 16 / 9,
			flip: { horizontal: false, vertical: false },
		} );
	}, [ setResetState ] );

	return (
		<div>
			{ /* Your cropper components */ }
			<button onClick={ reset }>Reset to Custom State</button>
		</div>
	);
}
```
