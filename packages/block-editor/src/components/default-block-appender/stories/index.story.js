/**
 * Internal dependencies
 */
import { DefaultBlockAppender } from '../..';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock } from '@wordpress/blocks';

registerCoreBlocks();

const blockEditorState = [ createBlock( 'core/paragraph' ) ];

const meta = {
	title: 'BlockEditor/DefaultBlockAppender',
	component: DefaultBlockAppender,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The DefaultBlockAppender component is used to add a new block to the editor when the editor is empty.',
			},
		},
	},
	argTypes: {
		rootClientId: {
			description: 'The client ID of the root block of the editor.',
			type: { name: 'string' },
			required: true,
		},
	},
};

export default meta;

export const Default = {
	args: {
		rootClientId: blockEditorState.map( ( block ) => block.clientId )[ 0 ],
	},
	render: function Template( args ) {
		return <DefaultBlockAppender { ...args } />;
	},
};
