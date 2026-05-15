/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WritingModeControl from '../';

const meta = {
	title: 'BlockEditor/WritingModeControl',
	component: WritingModeControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to facilitate writing mode selections.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'Currently selected writing mode.',
		},
		className: {
			control: 'text',
			description: 'Class name to add to the control.',
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description: 'Handles change in the writing mode selection.',
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();

		return (
			<WritingModeControl
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
