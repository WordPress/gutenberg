# FontSizePicker

FontSizePicker is a React component that renders a UI that allows users to select a font size.
The component renders a series of buttons that allow the user to select predefined (common) font sizes and contains a range slider that enables the user to select custom font sizes (by choosing the value.

## Usage


```jsx
import { FontSizePicker } from '@wordpress/components';
import { withState } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

...
const MyFontSizePicker = withState( {
	fontSize: 16,
} )( ( { fontSize, setState } ) => {
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
			fontSizes={ fontSizes }
			value={ fontSize }
			fallbackFontSize={ fallbackFontSize }
			onChange={ ( newFontSize ) => {
				setState( { fontSize: newFontSize } );
			} }
		/>
	);
} );

...

<MyFontSizePicker />
```

## Props

The component accepts the following props:

### disableCustomFontSizes

If `true`, it will not be possible to choose a custom fontSize. The user will be forced to pick one of the pre-defined sizes passed in fontSizes.

- Type: `Boolean`
- Required: no
- Default: `false`

### fallbackFontSize

If no value exists, this prop defines the starting position for the font size picker slider. Only relevant if `withSlider` is `true`.

- Type: `Number`
- Required: No

### fontSizes

An array of font size objects. The object should contain properties size, name, and slug.
The property `size` contains a number with the font size value, in `px`.
The `name` property includes a label for that font size e.g.: `Small`.
The `slug` property is a string with a unique identifier for the font size. Used for the class generation process.

- Type: `Array`
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
