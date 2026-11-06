# Image Cropper

<div class="callout callout-warning">
This package is deprecated. Build new croppers on <a href="https://github.com/WordPress/gutenberg/tree/HEAD/packages/image-editor/README.md"><code>@wordpress/image-editor</code></a>, which has the canvas and the controller this package now wraps. The package keeps working for existing consumers and will be removed in a later release. Mounting <code>ImageCropperProvider</code> logs a notice.
</div>

A thin wrapper over `@wordpress/image-editor` that keeps the component, provider and hook the package has always exported. Version 3.0 replaced the `react-easy-crop` library underneath; see [Changes in 3.0](#changes-in-30) for what a consumer can notice.

## Current features

- **Image Cropping**: a fixed crop area of the chosen aspect ratio, with the image panning and zooming under it
- **Rotation**: rotate images in 90-degree increments; the view refits on its own
- **Zoom Control**: zoom in and out, up to the component's `maxZoom`
- **Aspect Ratio**: set and maintain specific aspect ratios
- **Flip Controls**: horizontal and vertical image flipping
- **State Management**: centralized state management with React Context
- **Custom Reset State**: configure custom initial states for reset operations

## Installation

Install the module

```bash
npm install @wordpress/image-cropper --save
```

## Styles

The cropper needs its stylesheet for layout. Load `build-style/style.css` from your app's Sass:

```scss
@use "@wordpress/image-cropper/build-style/style.css";
```

Or import it from JavaScript:

```js
import '@wordpress/image-cropper/build-style/style.css';
```

The stylesheet includes the image editor's, so you do not need to load that one too.

## API

### Components

- `ImageCropper` - The main cropping component that provides the cropping canvas. It fills its parent, so render it inside a sized, positioned element.

```tsx
interface ImageCropperProps {
	src: string; // Image source URL
	onLoad?: ( mediaSize: MediaSize ) => void; // Callback when image loads with media dimensions
	minZoom?: number; // Accepted and ignored: the smallest zoom keeps the image covering the crop
	maxZoom?: number; // Maximum zoom level (default: 5)
}
```

- `ImageCropperProvider` - Context provider for state management. This component implements the React Context pattern to share cropper state across your application. It manages all internal cropper state including crop position, zoom levels, rotation, flip transformations, aspect ratios, and media dimensions. Any component that needs to read or modify cropper state must be a descendant of this provider. The provider also handles state persistence and provides methods for resetting to custom initial states.

### Hooks

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
	getCroppedImage, // Get the crop as a JPEG object URL; pass a processed copy of the image to cut from it instead

	// Reset state
	resetState, // Current reset state configuration
	isDirty, // Whether the state is dirty based on resetState or default settings
} = useImageCropper();
```

`cropperState` fields:

- `crop`: where the image sits under the crop area, as the image editor's pan: a signed offset from the centre in fractions of the image.
- `croppedArea`: the crop in percentages of the image, and `croppedAreaPixels` the same in pixels, or `null` before the image loads. Both are measured on the image after its flip and rotation, in the frame a server applies the crop to: after the flip, then after a clockwise rotation of `rotation` degrees, or of `360 - rotation` degrees when exactly one axis is flipped.
- `zoom`, `rotation` (0 to 360, clockwise), `flip` and `aspectRatio`.
- `mediaSize`: the loaded image's size, or `null` before it loads. `width` and `height` equal the natural size.

`setCropperState` takes a partial state, or a function from the previous state to one. It applies `rotation`, `aspectRatio`, `zoom`, `flip` and `crop`; the other fields are read from the editor, so writing them changes nothing.

### Types

- `ImageCropperState` - State interface for cropper data
- `ImageCropperProps` - Props interface for ImageCropper component
- `ImageCropperContextValue` - Context value interface
- `Flip` - Flip state interface
- `Point`, `Area`, `MediaSize` - Position, rectangle and image size types

### Utilities

- `normalizeRotation` - Utility function to normalize rotation values to 0-360 degrees

```tsx
import { normalizeRotation } from '@wordpress/image-cropper';

const normalized = normalizeRotation( -90 ); // Returns 270
const normalized2 = normalizeRotation( 450 ); // Returns 90
```

## Usage

### Basic Implementation

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

### Advanced Usage with Custom Reset State

You can configure a custom initial state that will be used when the reset function is called. Fields the reset state leaves out return to their defaults. A `crop` region in the reset state is not applied.

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

## Changes in 3.0

The exports and the hook's shape are unchanged. These are the differences a consumer of 2.x can notice:

- You load the stylesheet, `build-style/style.css`. The old library injected its own styles.
- `crop` is the image editor's pan in fractions of the image, not a pixel offset of the image.
- `croppedArea` and `croppedAreaPixels` are measured after the flip, then after the rotation described above. The old values were in the unflipped frame.
- `mediaSize.width` and `mediaSize.height` equal the natural size.
- A `crop` region in `setResetState` is ignored. Zoom, rotation, aspect ratio and flip apply.
- `minZoom` is accepted and ignored.
- A rotated image refits the view on its own.
- Zoom is clamped by the editor, with the component's `maxZoom` default of 5.
- Small crops are magnified on screen, up to 8x, and keep a 44px minimum size, so a square crop on a very wide image looks larger than before.
- The `reactEasyCrop_*`, `image-cropper__crop-area` and `image-cropper__image` class names are gone. The container keeps `image-cropper__container`. Extra props are no longer forwarded to the underlying component.
