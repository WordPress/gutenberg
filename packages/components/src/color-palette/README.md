# ColorPalette

## Usage

<!-- wp:docs/sandbox { "name": "color-palette" } -->
```jsx
import { ColorPalette } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const Example = withState( {
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
<!-- /wp:docs/sandbox -->