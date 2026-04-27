# FocalPointPicker

Focal Point Picker is a component which creates a UI for identifying the most important visual point of an image. It addresses two common issues in responsive image rendering. First, large background images are often cropped in undesirable ways, especially on smaller viewports such as mobile devices. Second, the CSS aspect-ratio property can inadvertently crop out the area of highest visual interest. This component allows the selection of the point with the most important visual information and returns it as a pair of numbers between 0 and 1. This value can be easily converted into the CSS `object-position` attribute, and will ensure that the focal point is never cropped out, regardless of viewport.

- Example focal point picker value: `{ x: 0.5, y: 0.1 }`
- Corresponding CSS: `object-position: 50% 10%`

## Usage

```jsx
import { useState } from 'react';
import { FocalPointPicker } from '@wordpress/components';

const Example = () => {
	const [ focalPoint, setFocalPoint ] = useState( {
		x: 0.5,
		y: 0.1,
	} );

	const url = '/path/to/image';

	/* Example function to render the CSS styles based on Focal Point Picker value */
	const style = {
		objectPosition: `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`,
	};

	return (
		<>
			<FocalPointPicker
				url={ url }
				value={ focalPoint }
				onDragStart={ setFocalPoint }
				onDrag={ setFocalPoint }
				onChange={ setFocalPoint }
			/>
			<img src={ url } style={ style }  />
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

Function which is called before internal updates to the value state. It receives the upcoming value and may return a modified one.
