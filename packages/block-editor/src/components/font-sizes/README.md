# FontSizePicker

FontSizePicker is a React component that renders a UI that allows users to select a font size.
The component renders a user interface that allows the user to select predefined (common) font sizes and contains an option that allows users to select custom font sizes (by choosing the value) if that functionality is enabled.
There is an equivalent component exposed under @wordpress/components. The difference between this component and the @wordpress components one is that this component does not require the `fontSizes` and `disableCustomFontSizes` properties. The editor settings are used to compute the value of these props.

## Usage


```jsx
import { FontSizePicker } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

...
const MyFontSizePicker = () => {
	const [ fontSize, setFontSize ] = useState( 16 );
	const fontSizes = [
		{
			name: __( 'Small' ),
			slug: 'small',
			size: 12,
		},
		{
			name: __( 'Big' ),
			slug: 'big',
			size: 26,
		},
	];
	const fallbackFontSize = 16;

	return (
		<FontSizePicker
			value={ fontSize }
			fallbackFontSize={ fallbackFontSize }
			onChange={ ( newFontSize ) => {
				setFontSize( newFontSize );
			} }
		/>
	);
} );

...

<MyFontSizePicker />
```

## Props

The component accepts the following props:


### fallbackFontSize

If no value exists, this prop defines the starting position for the font size picker slider. Only relevant if `withSlider` is `true`.

- Type: `Number`
- Required: No

### onChange

A function that receives the new font size value.
If onChange is called without any parameter, it should reset the value, attending to what reset means in that context, e.g., set the font size to undefined or set the font size a starting value.

- Type: `function`
- Required: Yes

### value

The current font size value.

- Type: `Number`
- Required: No

### withSlider

If `true`, the UI will contain a slider, instead of a numeric text input field. If `false`, no slider will be present.

- Type: `Boolean`
- Required: no
- Default: `false`
