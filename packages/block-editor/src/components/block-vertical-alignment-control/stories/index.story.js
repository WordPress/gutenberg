/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	BlockVerticalAlignmentControl,
	BlockVerticalAlignmentToolbar,
} from '../';

const meta = {
	title: 'BlockEditor/BlockVerticalAlignmentControl',
	component: BlockVerticalAlignmentControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Controls for vertical alignment of content within a block.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'The current value of the alignment setting.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description:
				"A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons",
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		controls: {
			control: 'check',
			description: 'Array of vertical alignment options to display.',
			options: [ 'top', 'center', 'bottom' ],
			table: {
				type: { summary: 'array' },
				defaultValue: { summary: "['top', 'center', 'bottom']" },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<BlockVerticalAlignmentControl
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

export const Toolbar = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<BlockVerticalAlignmentToolbar
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
