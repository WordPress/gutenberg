# ColorPalette

## Props

The component accepts the following props.

{ colors, disableCustomColors = false, value, onChange, className, clearable = true }
### colors

Array with the colors to be shown.

- Type: `Array`
- Required: Yes

### disableCustomColors

Whether to allow custom color or not.

- Type: `Boolean`
- Required: No
- Default: false

### value

currently active value

- Type: `String`
- Required: No

### onChange

Callback called when a color is selected.

- Type: `Function`
- Required: Yes

### className

classes to be applied to the container.

- Type: `String`
- Required: No
- Default: `Select or Upload Media`

### clearable

Whether the palette should have a clearing button or not.

- Type: `Boolean`
- Required: No
- Default: true


## Usage
```jsx
import { ColorPalette } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyColorPalette = withState( {
	color: '#f00',
} )( ( { color, setState } ) => {
	const colors = [
		{ name: 'red', color: '#f00' },
		{ name: 'white', color: '#fff' },
		{ name: 'blue', color: '#00f' },
	];

	return (
		<ColorPalette
			colors={ colors }
			value={ color }
			onChange={ ( color ) => setState( { color } ) }
		/>
	)
} );
```
