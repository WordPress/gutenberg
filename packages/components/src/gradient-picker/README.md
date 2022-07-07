# GradientPicker

GradientPicker is a React component that renders a color gradient picker to define a multi step gradient. There's either a _linear_ or a _radial_ type available.

![gradient-picker](https://user-images.githubusercontent.com/881729/147505438-3818c4c7-65b5-4394-b97b-af903c62adce.png)

## Usage

Render a GradientPicker.

```jsx
import { GradientPicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const myGradientPicker = () => {
	const [ gradient, setGradient ] = useState( null );

	return (
		<GradientPicker
			value={ gradient }
			onChange={ ( currentGradient ) => setGradient( currentGradient ) }
			gradients={ [
				{
					name: 'JShine',
					gradient:
						'linear-gradient(135deg,#12c2e9 0%,#c471ed 50%,#f64f59 100%)',
					slug: 'jshine',
				},
				{
					name: 'Moonlit Asteroid',
					gradient:
						'linear-gradient(135deg,#0F2027 0%, #203A43 0%, #2c5364 100%)',
					slug: 'moonlit-asteroid',
				},
				{
					name: 'Rastafarie',
					gradient:
						'linear-gradient(135deg,#1E9600 0%, #FFF200 0%, #FF0000 100%)',
					slug: 'rastafari',
				},
			] }
		/>
	);
};
```

## Props

The component accepts the following props:

### value

The current value of the gradient. Pass a css gradient like `linear-gradient(90deg, rgb(6, 147, 227) 0%, rgb(155, 81, 224) 100%)`. Optionally pass in a `null` value to specify no gradient is currently selected.

-   Type: `string`
-   Required: No
-   Default: `linear-gradient(90deg, rgb(6, 147, 227) 0%, rgb(155, 81, 224) 100%)`

### onChange

The function called when a new gradient has been defined. It is passed the `currentGradient` as an argument.

-   Type: `Function`
-   Required: Yes

### gradients

An array of objects of predefined gradients which show up as `CircularOptionPicker` above the gradient selector.

-   Type: `array`
-   Required: No

### clearable

Whether the palette should have a clearing button or not.

-   Type: `Boolean`
-   Required: No
-   Default: true

### clearGradient

Called when a new gradient has been defined. It is passed the `currentGradient` as an argument.

-   Type: `Function`
-   Required: No

### disableCustomGradients

If true, the gradient picker will not be displayed and only defined gradients from `gradients` are available.

-   Type: `Boolean`
-   Required: No
-   Default: false
