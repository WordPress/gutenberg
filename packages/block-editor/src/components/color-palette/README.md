## Color Palette

`Color Palette` allows the user to pick a color from a list of pre-defined color entries. It uses the core [`Color Palette`](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette) component and provides default values for the `colors` and `disableCustomColors` props based on Global Styles values.

## Development guidelines

### Usage

```jsx
import { ColorPalette } from '@wordpress/block-editor';

const MyColorPalette = () => {

	const paletteColor;
	const setColor = (color) => {
		paletteColor = color;
	}

	return (
		<ColorPalette
			value={ color }
			onChange={ ( color ) => setColor( color ) }
		/>
	);
} );
```

### Props

### colors: PaletteObject[] | ColorObject[]

Array with the colors to be shown. When displaying multiple color palettes to choose from, the format of the array changes from an array of colors objects, to an array of color palettes.

* Required: No
* Default: The `color.palette` Global Styles value.

### disableCustomColors: boolean

Whether to allow the user to pick a custom color on top of the predefined choices (defined via the colors prop).

* Available: No
* Default: The `color.custom` Global Styles value.

The rest of the props are the same as those defined in the core [`Color Palette`](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette#props) component including [clearable](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette#clearable-boolean), [enableAlpha](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette#clearable-boolean), [headingLevel](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette#headinglevel-1--2--3--4--5--6--1--2--3--4--5--6), [value](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette#value-string) and [onChange](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/color-palette#onchange-oncolorchange).
