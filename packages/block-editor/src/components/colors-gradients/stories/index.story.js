/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../control.js';

const meta = {
	title: 'BlockEditor/ColorGradientControl',
	component: ColorGradientControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A control to select and customize colors or gradients.',
			},
		},
	},
	argTypes: {
		colors: {
			control: 'object',
			description: 'Array of available colors.',
			table: {
				type: { summary: 'object[]' },
			},
		},
		gradients: {
			control: 'object',
			description: 'Array of available gradients.',
			table: {
				type: { summary: 'object[]' },
			},
		},
		disableCustomColors: {
			control: 'boolean',
			description: 'Disable custom color selection.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		disableCustomGradients: {
			control: 'boolean',
			description: 'Disable custom gradient selection.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		colorValue: {
			control: 'text',
			description: 'Current selected color value.',
			table: {
				type: { summary: 'string' },
			},
		},
		gradientValue: {
			control: 'text',
			description: 'Current selected gradient value.',
			table: {
				type: { summary: 'string' },
			},
		},
		onColorChange: {
			action: 'onColorChange',
			control: { type: null },
			description: 'Callback to handle color change.',
			table: {
				type: { summary: 'function' },
			},
		},
		onGradientChange: {
			action: 'onGradientChange',
			control: { type: null },
			description: 'Callback to handle gradient change.',
			table: {
				type: { summary: 'function' },
			},
		},
		enableAlpha: {
			control: 'boolean',
			description: 'Enable alpha transparency.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		clearable: {
			control: 'boolean',
			description: 'Allow clearing the selected color or gradient.',
			table: {
				type: { summary: 'boolean' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onColorChange, onGradientChange, ...args } ) {
		const [ colorValue, setColorValue ] = useState( args.colorValue );
		const [ gradientValue, setGradientValue ] = useState(
			args.gradientValue
		);

		return (
			<ColorGradientControl
				{ ...args }
				colorValue={ colorValue }
				gradientValue={ gradientValue }
				onColorChange={ ( newColor ) => {
					setColorValue( newColor );
					onColorChange( newColor );
				} }
				onGradientChange={ ( newGradient ) => {
					setGradientValue( newGradient );
					onGradientChange( newGradient );
				} }
			/>
		);
	},
	args: {
		colors: [
			{ name: 'Red', color: '#ff0000' },
			{ name: 'Green', color: '#00ff00' },
			{ name: 'Blue', color: '#0000ff' },
		],
		gradients: [
			{
				name: 'Sunset',
				gradient: 'linear-gradient(to right, #ff7e5f, #feb47b)',
			},
			{
				name: 'Ocean',
				gradient: 'linear-gradient(to right, #00c6ff, #0072ff)',
			},
		],
		colorValue: '#00ff00',
		gradientValue: 'linear-gradient(to right, #ff7e5f, #feb47b)',
		disableCustomColors: false,
		disableCustomGradients: false,
		enableAlpha: true,
		clearable: true,
		label: 'Select Color or Gradient',
	},
};
