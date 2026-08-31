/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockAlignmentControl } from '../';

const meta = {
	title: 'BlockEditor/BlockAlignmentControl',
	component: BlockAlignmentControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A control for selecting block alignment options in the editor. The different alignment options it provides are `left`, `center`, `right`, `wide` and `full`',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			defaultValue: 'undefined',
			description: 'The current value of the alignment setting.',
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description:
				"A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie:`left`, `center`, `right`, `wide`, and `full`) as the only argument.",
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<BlockAlignmentControl
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
