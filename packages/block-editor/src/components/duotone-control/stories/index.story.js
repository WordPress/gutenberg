/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DuotoneControl from '../';

const meta = {
	title: 'BlockEditor/DuotoneControl',
	component: DuotoneControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'`DuotoneControl` is a component that allows users to apply a duotone filter to images or media elements. It includes a dropdown for selecting predefined filters or customizing duotone settings.',
			},
		},
	},
	argTypes: {
		id: {
			control: 'text',
			description: 'Optional ID for the control.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		colorPalette: {
			control: 'array',
			description:
				'An array of color options available for custom duotone.',
			table: {
				type: {
					summary: 'Array<Color>',
				},
			},
		},
		duotonePalette: {
			control: 'array',
			description:
				'An array of predefined duotone filter options available in the control.',
			table: {
				type: {
					summary: 'Array<Duotone>',
				},
			},
		},
		disableCustomColors: {
			control: 'boolean',
			description: 'Disable the option to use custom colors in duotone.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		disableCustomDuotone: {
			control: 'boolean',
			description:
				'Disable the ability to define custom duotone filters.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		value: {
			control: 'object',
			description:
				'The currently selected duotone filter, either predefined or custom.',
			table: {
				type: {
					summary: 'Duotone | "unset"',
				},
			},
		},
		onChange: {
			action: 'changed',
			description:
				'Callback function triggered when the duotone value changes.',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
	},
};

export default meta;

const Template = ( args ) => {
	const [ selectedValue, setSelectedValue ] = useState(
		args.value || 'unset'
	);

	return (
		<DuotoneControl
			{ ...args }
			value={ selectedValue }
			onChange={ ( newValue ) => {
				setSelectedValue( newValue );
			} }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		colorPalette: [
			{ color: '#000000', name: 'Black' },
			{ color: '#FFFFFF', name: 'White' },
			{ color: '#FF0000', name: 'Red' },
		],
		duotonePalette: [
			{ colors: [ '#000000', '#FFFFFF' ], name: 'Grayscale' },
			{ colors: [ '#FF0000', '#00FF00' ], name: 'Sunset' },
		],
		disableCustomColors: false,
		disableCustomDuotone: false,
		value: 'unset',
	},
};
