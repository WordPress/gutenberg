# FocalPointPicker

Focal Point Picker is a component which creates a UI for identifying the most important visual point of an image. This component addresses a specific problem: with large background images it is common to see undesirable crops, especially when viewing on smaller viewports such as mobile phones. This component allows the selection of the point with the most important visual information and returns it as a pair of numbers between 0 and 1. This value can be easily converted into the CSS `background-position` attribute, and will ensure that the focal point is never cropped out, regardless of viewport.

- Example focal point picker value: `{ x: 0.5, y: 0.1 }`
- Corresponding CSS: `background-position: 50% 10%;`

## Usage

```jsx
import { useState } from 'react';
import { FocalPointPicker } from '@wordpress/components';

const Example = () => {
	const [ focalPoint, setFocalPoint ] = useState( {
		x: 0.5,
		y: 0.5,
	} );

	const url = '/path/to/image';

	/* Example function to render the CSS styles based on Focal Point Picker value */
	const style = {
		backgroundImage: `url(${ url })`,
		backgroundPosition: `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`,
	};

	return (
		<>
			<FocalPointPicker
			  __nextHasNoMarginBottom
				url={ url }
				value={ focalPoint }
				onDragStart={ setFocalPoint }
				onDrag={ setFocalPoint }
				onChange={ setFocalPoint }
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

Function which is called before internal updates to the value state. It receives the upcoming value and may return a modified one.

### `__next40pxDefaultSize`

-   Type: `Boolean`
-   Required: No
-   Default: `false`

Start opting into the new margin-free styles that will become the default in a future version.

### `__nextHasNoMarginBottom`

-   Type: `Boolean`
-   Required: No
-   Default: `false`

Start opting into the new margin-free styles that will become the default in a future version.