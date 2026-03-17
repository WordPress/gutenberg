/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextTransformControl from '../';

const meta = {
	title: 'BlockEditor/TextTransformControl',
	component: TextTransformControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Control to facilitate text transformation selections.',
			},
		},
	},
	argTypes: {
		onChange: {
			action: 'onChange',
			control: {
				type: null,
			},
			description: 'Handles change in text transform selection.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		className: {
			control: { type: 'text' },
			description: 'Class name to add to the control.',
			table: {
				type: { summary: 'string' },
			},
		},
		value: {
			control: { type: null },
			description: 'Currently selected text transform.',
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
			<TextTransformControl
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
