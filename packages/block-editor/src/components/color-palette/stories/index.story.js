/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorPalette } from '@wordpress/block-editor';

export default {
	title: 'Components/ColorPaletteControl',
	component: ColorPalette,
	argTypes: {
		onChange: { action: 'onChange' },
	},
};

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ color, setColor ] = useState( null );

		return (
			<div style={ { padding: '20px', background: '#f4f4f4' } }>
				<ColorPalette
					{ ...args }
					value={ color }
					onChange={ ( newColor ) => {
						setColor( newColor );
						onChange( newColor );
					} }
				/>
				<div style={ { marginTop: '10px' } }>
					<strong>Selected Color:</strong> { color || 'None' }
				</div>
			</div>
		);
	},
	args: {
		colors: [
			{ name: 'Red', color: '#f00' },
			{ name: 'Green', color: '#0f0' },
			{ name: 'Blue', color: '#00f' },
			{ name: 'Yellow', color: '#ff0' },
		],
		disableCustomColors: false,
	},
};
