/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DateFormatPicker from '../';

export default {
	title: 'BlockEditor/DateFormatPicker',
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
			control: { type: null },
			description:
				'The selected date format. If `null`, _Default_ is selected.',
			table: {
				type: { summary: 'string | null' },
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description:
				'Called when a selection is made. If `null`, _Default_ is selected.',
			table: {
				type: { summary: 'function' },
			},
		},
	},
};

export const Default = {
	args: {
		defaultFormat: 'M j, Y',
	},
	render: function Template( { onChange, ...args } ) {
		const [ format, setFormat ] = useState();
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
