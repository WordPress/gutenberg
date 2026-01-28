/**
 * Internal dependencies
 */
import BlockQuickNavigation from '..';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

registerCoreBlocks();

const blockEditorState = [
	createBlock( 'core/paragraph' ),
	createBlock( 'core/heading' ),
];

dispatch( 'core/block-editor' ).resetBlocks( blockEditorState );

const meta = {
	title: 'BlockEditor/BlockQuickNavigation',
	component: BlockQuickNavigation,
	tags: [ 'status-private' ],
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'The `BlockQuickNavigation` component displays a list of blocks with quick navigation.',
			},
		},
	},
	argTypes: {
		clientIds: {
			control: { type: null },
			description: 'Array of block clientIds',
			table: {
				type: {
					summary: 'Array',
				},
			},
		},
		onSelect: {
			control: {
				type: 'function',
			},
			description: 'Callback function to call when a block is selected',
			table: {
				type: {
					summary: 'Function',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		clientIds: blockEditorState.map( ( block ) => block.clientId ),
	},
	render: function Template( { onSelect, ...args } ) {
		return (
			<BlockQuickNavigation
				{ ...args }
				onSelect={ ( ...changeArgs ) => {
					onSelect( ...changeArgs );
				} }
			/>
		);
	},
};
