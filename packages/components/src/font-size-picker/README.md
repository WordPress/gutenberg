# FontSizePicker

FontSizePicker is a React component that renders a UI that allows users to select a font size.
The component renders a user interface that allows the user to select predefined (common) font sizes and contains an option that allows users to select custom font sizes (by choosing the value) if that functionality is enabled.

## Usage

```jsx
import { useState } from 'react';
import { FontSizePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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

const MyFontSizePicker = () => {
	const [ fontSize, setFontSize ] = useState( 12 );

	return (
		<FontSizePicker
			__next40pxDefaultSize
			fontSizes={ fontSizes }
			value={ fontSize }
			fallbackFontSize={ fallbackFontSize }
			onChange={ ( newFontSize ) => {
				setFontSize( newFontSize );
			} }
		/>
	);
};

...

<MyFontSizePicker />
```

## Props

The component accepts the following props:

### `disableCustomFontSizes`: `boolean`

If `true`, it will not be possible to choose a custom fontSize. The user will be forced to pick one of the pre-defined sizes passed in fontSizes.

-   Required: no
-   Default: `false`

### `fallbackFontSize`: `number`

If no value exists, this prop defines the starting position for the font size picker slider. Only relevant if `withSlider` is `true`.

-   Required: No

### `fontSizes`: `FontSize[]`

An array of font size objects. The object should contain properties size, name, and slug.
The property `size` contains a number with the font size value, in `px` or a string specifying the font size CSS property that should be used eg: "13px", "1em", or "clamp(12px, 5vw, 100px)".
The `name` property includes a label for that font size e.g.: `Small`.
The `slug` property is a string with a unique identifier for the font size. Used for the class generation process.

**Note:** The slugs `default` and `custom` are reserved and cannot be used.

-   Required: No
-   Default: `[]`

### `onChange`: `( value: number | string | undefined, selectedItem?: FontSize ) => void`

A function that receives the new font size value.
If onChange is called without any parameter, it should reset the value, attending to what reset means in that context, e.g., set the font size to undefined or set the font size a starting value.

-   Required: Yes

### `size`: `'default' | '__unstable-large'`

Size of the control.

-   Required: No
-   Default: `'default'`

### `units`: `string[]`

Available units for custom font size selection.

-   Required: No
-   Default: `[ 'px', 'em', 'rem', 'vw', 'vh' ]`

### `value`: `number | string`

The current font size value.

**Note**: For the `units` property to work, the current font size value must be specified as strings with units (e.g., `'12px'` instead of `12`). When the font size is provided as a number, the component operates in "unitless mode" where the `units` property has no effect.

-   Required: No

### `withReset`: `boolean`

If `true`, a reset button will be displayed alongside the input field when a custom font size is active. Has no effect when `disableCustomFontSizes` is `true`.

-   Required: no
-   Default: `true`

### `withSlider`: `boolean`

If `true`, a slider will be displayed alongside the input field when a custom font size is active. Has no effect when `disableCustomFontSizes` is `true`.

-   Required: no
-   Default: `false`

### `__next40pxDefaultSize`: `boolean`

Start opting into the larger default height that will become the default size in a future version.

- Required: No
- Default: `false`
