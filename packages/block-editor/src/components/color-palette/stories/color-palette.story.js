/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorPalette } from '@wordpress/block-editor';

export default {
	title: 'BlockEditor/ColorPalette',
	component: ColorPalette,
	parameters: {
		docs: {
			description: {
				component:
					'The `ColorPalette` component renders a palette of selectable colors for users to apply to block editor components, allowing selection from a predefined set of colors.',
			},
		},
	},
	argTypes: {
		onChange: { action: 'Color selected' },
	},
};

function ColorPaletteStory( { onChange, ...args } ) {
	const [ selectedColor, setSelectedColor ] = useState( null );

	return (
		<div style={ { padding: '20px', background: '#f0f0f0' } }>
			<ColorPalette
				{ ...args }
				value={ selectedColor }
				onChange={ ( color ) => {
					setSelectedColor( color );
					onChange( color );
				} }
			/>
			<div style={ { marginTop: '12px' } }>
				<strong>Color Selected:</strong> { selectedColor || 'None' }
			</div>
		</div>
	);
}

export const Default = {
	render: ColorPaletteStory,
	args: {
		colors: [
			{ name: 'Red', color: '#FF0000' },
			{ name: 'Orange', color: '#FF7F00' },
			{ name: 'Yellow', color: '#FFFF00' },
			{ name: 'Green', color: '#00FF00' },
			{ name: 'Blue', color: '#0000FF' },
			{ name: 'Indigo', color: '#4B0082' },
			{ name: 'Violet', color: '#8B00FF' },
			{ name: 'Black', color: '#000000' },
			{ name: 'White', color: '#FFFFFF' },
		],
		disableCustomColors: false,
	},
};
