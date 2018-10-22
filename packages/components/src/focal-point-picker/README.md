# Focal Point Picker

Focal Point Picker is a component which creates a UI for identifying the most visually important point on an image, which can be used to ensure that the image is cropped appropriately. The component is useful for background images which may be cropped in undesirable ways on small and irregular viewports. The selected point is returned as an object containing `x` and `y` values between 0-1, which can be converted to percentages and applied as the image container's `background-position` attribute.

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
	const style = {
		backgroundImage: `url(${ url })` ,
		backgroundPosition: `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`
	}
	const imageContainer = <div style={ style } />;
	return ( 
		<FocalPointPicker 
			url={ url }
			dimensions={ dimensions }
			value={ focalPoint }
			onChange={ ( focalPoint ) => setState( { focalPoint } ) } 
		/>
	) 
} );
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
- Required: No
- Description: The focal point. Should be an object containing `x` and `y` params.

### `onChange`

- Type: `Function`
- Required: No
- Description: Callback which is called when the focal point changes. 
