# FocalPointPicker

Focal Point Picker is a component which creates a UI for identifying the most important visual point of an image. This component addresses a specific problem: with large background images it is common to see undesirable crops, especially when viewing on smaller viewports such as mobile phones. This component allows the selection of the point with the most important visual information and returns it as a pair of numbers between 0 and 1. This value can be easily converted into the CSS `background-position` attribute, and will ensure that the focal point is never cropped out, regardless of viewport.

Example focal point picker value: `{ x: 0.5, y: 0.1 }`
Corresponding CSS: `background-position: 50% 10%;`

## Usage

```jsx
import { FocalPointPicker } from '@wordpress/components';

const MyFocalPointPicker = withState( {
	focalPoint: {
		x: 0.5,
		y: 0.5
	},
} )( ( { focalPoint, setState } ) => { 
	const url = '/path/to/image';
	const dimensions = {
		width: 400,
		height: 100
	};
	return ( 
		<FocalPointPicker 
			url={ url }
			dimensions={ dimensions }
			value={ focalPoint }
			onChange={ ( focalPoint ) => setState( { focalPoint } ) } 
		/>
	) 
} );

/* Example function to render the CSS styles based on Focal Point Picker value */
const renderImageContainerWithFocalPoint = ( url, focalPoint ) => {
	const style = {
		backgroundImage: `url(${ url })` ,
		backgroundPosition: `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`
	}
	return <div style={ style } />;
};
```

## Props

### `url`

- Type: `Text`
- Required: Yes
- Description: URL of the image to be displayed

### `dimensions`

- Type: `Object`
- Required: Yes
- Description: An object describing the height and width of the image. Requires two paramaters: `height`, `width`.

### `value`

- Type: `Object`
- Required: Yes
- Description: The focal point. Should be an object containing `x` and `y` params.

### `onChange`

- Type: `Function`
- Required: Yes
- Description: Callback which is called when the focal point changes. 
