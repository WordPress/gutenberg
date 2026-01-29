/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockAlignmentMatrixControl from '../';

const meta = {
	title: 'BlockEditor/BlockAlignmentMatrixControl',
	component: BlockAlignmentMatrixControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Renders a control for selecting block alignment using a matrix of alignment options.',
			},
		},
	},
	argTypes: {
		label: {
			control: 'text',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: "'Change matrix alignment'" },
			},
			description: 'Label for the control.',
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: '() => {}' },
			},
			description:
				"Function to execute upon a user's change of the matrix state.",
		},
		isDisabled: {
			control: 'boolean',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
			description: 'Whether the control should be disabled.',
		},
		value: {
			control: { type: null },
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: "'center'" },
			},
			description: 'Content alignment location.',
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();

		return (
			<BlockAlignmentMatrixControl
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
			/>
		);
	},
};
