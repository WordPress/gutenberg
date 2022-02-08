# FocalPointPicker

Focal Point Picker is a component which creates a UI for identifying the most important visual point of an image. This component addresses a specific problem: with large background images it is common to see undesirable crops, especially when viewing on smaller viewports such as mobile phones. This component allows the selection of the point with the most important visual information and returns it as a pair of numbers between 0 and 1. This value can be easily converted into the CSS `background-position` attribute, and will ensure that the focal point is never cropped out, regardless of viewport.

Example focal point picker value: `{ x: 0.5, y: 0.1 }`
Corresponding CSS: `background-position: 50% 10%;`

## Usage

```jsx
import { FocalPointPicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ focalPoint, setFocalPoint ] = useState( {
		x: 0.5,
		y: 0.5,
	} );

	const url = '/path/to/image';
	const dimensions = {
		width: 400,
		height: 100,
	};

	/* Example function to render the CSS styles based on Focal Point Picker value */
	const style = {
		backgroundImage: `url(${ url })`,
		backgroundPosition: `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`,
	};

	return (
		<>
			<FocalPointPicker
				url={ url }
				dimensions={ dimensions }
				value={ focalPoint }
				onChange={ ( focalPoint ) => setFocalPoint( { focalPoint } ) }
			/>
			<div style={ style } />
		</>
	);
};
```

## Props

### `url`

-   Type: `Text`
-   Required: Yes

URL of the image or video to be displayed

### `autoPlay`

-   Type: `Boolean`
-   Required: No
-   Default: `true`

Autoplays HTML5 video. This only applies to video sources (`url`).

### `value`

-   Type: `Object`
-   Required: Yes

The focal point. Should be an object containing `x` and `y` params.

### `onChange`

-   Type: `Function`
-   Required: Yes

Callback which is called when the focal point changes.

### `onDrag`

-   Type: `Function`
-   Required: No

Callback which is called repetitively during drag operations.

### `onDragEnd`

-   Type: `Function`
-   Required: No

Callback which is called at the end of drag operations.

### `onDragStart`

-   Type: `Function`
-   Required: No

Callback which is called at the start of drag operations.

### `resolvePoint`

-   Type: `Function`
-   Required: No

A function that receives the current value and returns a modified value. It is called before the onDrag callback.
