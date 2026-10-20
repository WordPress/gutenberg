import type { Meta, StoryObj } from '@storybook/react-vite';
// @ts-expect-error `@wordpress/block-library` does not expose type declarations for its entry point.
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock } from '@wordpress/blocks';
import { ExperimentalBlockEditorProvider } from '../../provider';
import BlockTitle from '../';

// Register core blocks for the story environment
registerCoreBlocks();

// Sample blocks for testing
const blocks = [ createBlock( 'core/paragraph' ) ];

const meta = {
	id: 'blockeditor-blocktitle',
	title: 'Editor/Block Editor/BlockTitle',
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
			// @ts-expect-error Bug: `null` is not a control type, `false` hides the control.
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
} satisfies Meta< typeof BlockTitle >;

export default meta;

export const Default: StoryObj< typeof meta > = {
	args: {
		clientId: blocks[ 0 ].clientId,
	},
};
