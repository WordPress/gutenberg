import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import UnitControl from '../';

const meta: Meta< typeof UnitControl > = {
	id: 'blockeditor-unitcontrol',
	title: 'Editor/Block Editor/UnitControl',
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
			// @ts-expect-error Storybook types omit `null`, which hides the control.
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
				defaultValue: { summary: 'false' },
			},
		},
		disableUnits: {
			control: 'boolean',
			description: 'If true, the unit select is hidden.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		isPressEnterToChange: {
			control: 'boolean',
			description:
				'If true, the ENTER key press is required to trigger onChange. Change is also triggered on blur.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		isUnitSelectTabbable: {
			control: 'boolean',
			description: 'Determines if the unit select is tabbable.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string >();
		return (
			<UnitControl
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					// Storybook passes an action.
					onChange!( ...changeArgs );
					// @ts-expect-error The state setter ignores the extra arguments.
					setValue( ...changeArgs );
				} }
			/>
		);
	},
	args: {
		label: 'Label',
	},
};
