/**
 * Internal dependencies
 */
import BlockStyles from '..';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

registerCoreBlocks();

const blockEditorState = [ createBlock( 'core/paragraph' ) ];

dispatch( 'core/block-editor' ).resetBlocks( blockEditorState );

const meta = {
	title: 'BlockEditor/BlockStyles',
	component: BlockStyles,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'The `BlockStyles` component renders a list of block styles for a given block.',
			},
		},
	},
	argTypes: {
		clientId: {
			control: {
				type: 'text',
			},
			description: 'The block client ID.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onSwitch: {
			control: {
				type: 'function',
			},
			description: 'Callback to switch the block style.',
			table: {
				type: {
					summary: 'function',
				},
			},
			defaultValue: 'noop',
		},
		onHoverClassName: {
			control: {
				type: 'function',
			},
			description: 'Callback to set the hover class name.',
			table: {
				type: {
					summary: 'function',
				},
			},
			defaultValue: 'noop',
		},
	},
};

export default meta;

export const Default = {
	args: {
		clientId: blockEditorState[ 0 ].clientId,
		onSwitch: () => {},
		onHoverClassName: () => {},
	},
	render: function Template( args ) {
		return <BlockStyles { ...args } />;
	},
};
