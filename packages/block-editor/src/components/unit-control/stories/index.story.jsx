/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';

const meta = {
	title: 'BlockEditor/UnitControl',
	component: UnitControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'UnitControl allows the user to set a numeric quantity as well as a unit.',
			},
		},
	},
	argTypes: {
		onChange: {
			action: 'onChange',
			description: 'Callback function when the value changes.',
			table: {
				type: { summary: 'function' },
			},
		},
		onUnitChange: {
			action: 'onUnitChange',
			description: 'Callback function when the unit changes.',
			table: {
				type: { summary: 'function' },
			},
		},
		labelPosition: {
			control: 'radio',
			options: [ 'top', 'side', 'bottom', 'edge' ],
			description: 'The position of the label.',
			table: {
				type: { summary: 'string' },
			},
		},
		label: {
			control: 'text',
			description: 'The label for the control.',
			table: {
				type: { summary: 'string' },
			},
		},
		value: {
			control: { type: null },
			description: 'The value of the control.',
			table: {
				type: { summary: 'string' },
			},
		},
		size: {
			control: 'radio',
			options: [ 'default', 'small' ],
			description: 'The size of the control.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: 'default' },
			},
		},
		disabled: {
			control: 'boolean',
			description: 'Whether the control is disabled.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		disableUnits: {
			control: 'boolean',
			description: 'If true, the unit select is hidden.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		isPressEnterToChange: {
			control: 'boolean',
			description:
				'If true, the ENTER key press is required to trigger onChange. Change is also triggered on blur.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		isUnitSelectTabbable: {
			control: 'boolean',
			description: 'Determines if the unit select is tabbable.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: true },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<UnitControl
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
			/>
		);
	},
	args: {
		label: 'Label',
	},
};
