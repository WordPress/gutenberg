/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextAlignmentControl from '../';

const meta = {
	title: 'BlockEditor/TextAlignmentControl',
	component: TextAlignmentControl,
	tags: [ 'status-private' ],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to facilitate text alignment selections.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'Currently selected text alignment value.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description: 'Handles change in text alignment selection.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		options: {
			control: 'check',
			description: 'Array of text alignment options to display.',
			options: [ 'left', 'center', 'right', 'justify' ],
			table: {
				type: { summary: 'array' },
			},
		},
		className: {
			control: 'text',
			description: 'Class name to add to the control.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<TextAlignmentControl
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
