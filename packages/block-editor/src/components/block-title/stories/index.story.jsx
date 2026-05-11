/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { ExperimentalBlockEditorProvider } from '../../provider';
import BlockTitle from '../';

// Register core blocks for the story environment
registerCoreBlocks();

// Sample blocks for testing
const blocks = [ createBlock( 'core/paragraph' ) ];

const meta = {
	title: 'BlockEditor/BlockTitle',
	component: BlockTitle,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					"Renders the block's configured title as a string, or empty if the title cannot be determined.",
			},
		},
	},
	decorators: [
		( Story ) => (
			<ExperimentalBlockEditorProvider value={ blocks }>
				<Story />
			</ExperimentalBlockEditorProvider>
		),
	],
	argTypes: {
		clientId: {
			control: { type: null },
			description: 'Client ID of block.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		maximumLength: {
			control: { type: 'number' },
			description:
				'The maximum length that the block title string may be before truncated.',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		context: {
			control: { type: 'text' },
			description: 'The context to pass to `getBlockLabel`.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		clientId: blocks[ 0 ].clientId,
	},
};
