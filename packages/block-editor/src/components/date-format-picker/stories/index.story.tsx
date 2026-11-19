import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import DateFormatPicker from '../';

const meta: Meta< typeof DateFormatPicker > = {
	id: 'blockeditor-dateformatpicker',
	title: 'Editor/Block Editor/DateFormatPicker',
	component: DateFormatPicker,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The `DateFormatPicker` component enables users to configure their preferred *date format*. This determines how dates are displayed.',
			},
		},
	},
	argTypes: {
		defaultFormat: {
			control: 'text',
			description:
				'The date format that will be used if the user selects "Default".',
			table: {
				type: { summary: 'string' },
			},
		},
		format: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description:
				'The selected date format. If `null`, _Default_ is selected.',
			table: {
				type: { summary: 'string | null' },
			},
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description:
				'Called when a selection is made. If `null`, _Default_ is selected.',
			table: {
				type: { summary: 'function' },
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		defaultFormat: 'M j, Y',
	},
	render: function Template( { onChange, ...args } ) {
		const [ format, setFormat ] = useState< string | null >( null );
		return (
			<DateFormatPicker
				{ ...args }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setFormat( ...changeArgs );
				} }
				format={ format }
			/>
		);
	},
};
