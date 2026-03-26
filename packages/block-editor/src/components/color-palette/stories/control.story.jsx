/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPaletteControl from '../control';

export default {
	title: 'BlockEditor/ColorPaletteControl',
	component: ColorPaletteControl,
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'ColorPaletteControl is a wrapper designed for the Block Inspector sidebar. It provides a label, a color swatch grid, and a color value input.',
			},
		},
	},
	argTypes: {
		onChange: {
			action: 'onChange',
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description: 'Callback fired when color changes.',
		},
		value: {
			control: false,
			table: { disable: true },
		},
		label: {
			control: 'text',
			description: 'Label for the control.',
			table: {
				type: { summary: 'string' },
			},
		},
		disableCustomColors: {
			control: 'boolean',
			description:
				'Whether to allow the user to pick a custom hex color.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		colors: {
			control: 'object',
			description: 'Array of color definitions ({ name, color, slug }).',
			table: {
				type: { summary: 'object[]' },
			},
		},
	},
};

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ color, setColor ] = useState( args.value );

		return (
			<div style={ { maxWidth: '280px' } }>
				<ColorPaletteControl
					{ ...args }
					value={ color }
					onChange={ ( newColor ) => {
						setColor( newColor );
						onChange( newColor );
					} }
				/>
			</div>
		);
	},
	args: {
		label: 'Text Color',
		value: '#000000',
		disableCustomColors: false,
		colors: [
			{ name: 'Black', color: '#000000', slug: 'black' },
			{ name: 'Gray', color: '#555555', slug: 'gray' },
			{ name: 'White', color: '#ffffff', slug: 'white' },
			{ name: 'Red', color: '#cf2e2e', slug: 'red' },
			{ name: 'Blue', color: '#0693e3', slug: 'blue' },
		],
	},
};
