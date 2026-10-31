/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SpacingSizesControl from '../';

const meta = {
	title: 'BlockEditor/SpacingSizesControl',
	component: SpacingSizesControl,
	argTypes: {
		label: {
			control: 'text',
			description:
				'Label for the control, describing the type of spacing being modified.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: 'undefined' },
			},
		},
		values: {
			control: 'object',
			description: 'Current spacing values for each side.',
			table: {
				type: { summary: 'object' },
				defaultValue: {
					summary: '{ top: 0, right: 0, bottom: 0, left: 0 }',
				},
			},
		},
		onChange: {
			control: false,
			description: 'Callback triggered when spacing values are updated.',
			table: {
				type: { summary: 'Function' },
				defaultValue: { summary: 'undefined' },
			},
		},
		minimumCustomValue: {
			control: 'number',
			description: 'Minimum custom spacing value allowed.',
			table: {
				type: { summary: 'number' },
				defaultValue: { summary: 0 },
			},
		},
		sides: {
			control: 'array',
			description:
				'Array of sides to be controlled (e.g., top, right, bottom, left).',
			table: {
				type: { summary: 'array' },
				defaultValue: {
					summary: '[ "top", "right", "bottom", "left" ]',
				},
			},
		},
		showSideInLabel: {
			control: 'boolean',
			description: 'Whether to include the side name in the label.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: true },
			},
		},
		useSelect: {
			control: false,
			description: 'Optional hook for custom select logic.',
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: 'undefined' },
			},
		},
		onMouseOver: {
			control: false,
			description:
				'Callback triggered when the mouse hovers over a side.',
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: 'undefined' },
			},
		},
		onMouseOut: {
			control: false,
			description: 'Callback triggered when the mouse leaves a side.',
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: 'undefined' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		// Using state to demonstrate interactivity
		const [ values, setValues ] = useState( args.values );

		return (
			<SpacingSizesControl
				{ ...args }
				values={ values }
				onChange={ ( newValues ) => {
					setValues( newValues );
				} }
			/>
		);
	},
	args: {
		label: 'Padding',
		values: {
			top: 10,
			right: 12,
			bottom: 23,
			left: 25,
		},
		minimumCustomValue: 0,
		sides: [ 'top', 'right', 'bottom', 'left' ],
		showSideInLabel: true,
	},
};
