# ColorPalette

`ColorPalette` allows the user to pick a color from a list of pre-defined color entries.

## Usage

```jsx
import { ColorPalette } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyColorPalette = () => {
	const [ color, setColor ] = useState ( '#f00' )
	const colors = [
		{ name: 'red', color: '#f00' },
		{ name: 'white', color: '#fff' },
		{ name: 'blue', color: '#00f' },
	];

	return (
		<ColorPalette
			colors={ colors }
			value={ color }
			onChange={ ( color ) => setColor( color ) }
		/>
	);
} );
```

If you're using this component outside the editor, you can
[ensure `Tooltip` positioning](/packages/components/README.md#popovers-and-tooltips)
for the `ColorPalette`'s color swatches, by rendering your `ColorPalette` with a
`Popover.Slot` further up the element tree and within a
`SlotFillProvider` overall.

## Props

The component accepts the following props.

### colors
Array with the colors to be shown. When displaying multiple color palettes to choose from, the format of the array changes from an array of colors objects, to an array of color palettes.

-   Type: `Array`
-   Required: No
-   Default: `[]`

### disableCustomColors

Whether to allow the user to pick a custom color on top of the predefined choices (defined via the `colors` prop).

-   Type: `Boolean`
-   Required: No
-   Default: false

### enableAlpha

Whether the color picker should display the alpha channel both in the bottom inputs as well as in the color picker itself.

-   Type: `Boolean`
-   Required: No
-   Default: false

### value

currently active value

-   Type: `String`
-   Required: No

### onChange

Callback called when a color is selected.

-   Type: `Function`
-   Required: Yes

### className

classes to be applied to the container.

-   Type: `String`
-   Required: No

### clearable

Whether the palette should have a clearing button.

-   Type: `Boolean`
-   Required: No
-   Default: true
