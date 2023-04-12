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

### `clearable`: `boolean`

Whether the palette should have a clearing button.

-   Required: No
-   Default: `true`

### `colors`: `PaletteObject[] | ColorObject[]`

Array with the colors to be shown. When displaying multiple color palettes to choose from, the format of the array changes from an array of colors objects, to an array of color palettes.

-   Required: No
-   Default: `[]`

### `disableCustomColors`: `boolean`

Whether to allow the user to pick a custom color on top of the predefined
choices (defined via the `colors` prop).

-   Required: No
-   Default: `false`

### `enableAlpha`: `boolean`

This controls whether the alpha channel will be offered when selecting custom
colors.

-   Required: No
-   Default: `false`

### `headingLevel`: `1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6'`

The heading level.

-   Required: No
-   Default: `2`

### `value`: `string`

Currently active value.

-   Required: No

### `onChange`: `OnColorChange`

Callback called when a color is selected.

-   Required: Yes
