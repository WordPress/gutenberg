# FocalPointPicker

Focal Point Picker is a component which creates a UI for identifying the most important visual point of an image.

It addresses two common issues when displaying images in cropped containers. First, large background images can be cropped in undesirable ways, especially on smaller viewports such as mobile devices. Second, the CSS aspect-ratio property can inadvertently crop out the area of highest visual interest. This component allows the selection of the point with the most important visual information and returns it as a pair of numbers between 0 and 1. The output value can be applied to either CSS `background-position` (for elements with `background-image`) or `object-position` (for `<img>` / `<video>` elements rendered with `object-fit: cover`).

-   Example focal point picker value: `{ x: 0.5, y: 0.1 }`;
-   Corresponding CSS: `object-position: 50% 10%`;

## Usage

```jsx
import { FocalPointPicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ focalPoint, setFocalPoint ] = useState( {
		x: 0.5,
		y: 0.1,
	} );

	const url = '/path/to/image';

	/* Example function to render the CSS styles based on Focal Point Picker value */
	const style = {
		width: '100%',
		aspectRatio: '16 / 9',
		objectFit: 'cover',
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
			<img src={ url } alt="" style={ style } />
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
