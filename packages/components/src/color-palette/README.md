# ColorPalette

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
