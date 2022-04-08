# ColorPalette

## Props

The component accepts the following props.

{ colors, disableCustomColors = false, value, onChange, className, clearable = true }

### colors

Array with the colors to be shown.

-   Type: `Array`
-   Required: Yes

### disableCustomColors

Whether to allow custom color or not.

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
-   Default: `Select or Upload Media`

### clearable

Whether the palette should have a clearing button or not.

-   Type: `Boolean`
-   Required: No
-   Default: true

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
