/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PlainText from '..';

const meta = {
	title: 'BlockEditor/PlainText',
	component: PlainText,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'PlainText renders an auto-growing textarea that allows users to enter any textual content.',
			},
		},
	},
	argTypes: {
		value: {
			control: {
				type: null,
			},
			table: {
				type: {
					summary: 'string',
				},
			},
			description: 'String value of the textarea.',
		},
		onChange: {
			action: 'onChange',
			control: {
				type: null,
			},
			table: {
				type: {
					summary: 'function',
				},
			},
			description: 'Function called when the text value changes.',
		},
		className: {
			control: 'text',
			table: {
				type: {
					summary: 'string',
				},
			},
			description: 'Additional class name for the PlainText.',
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<PlainText
				{ ...args }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
				value={ value }
			/>
		);
	},
};
