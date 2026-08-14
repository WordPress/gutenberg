import {
	createBlock,
	registerBlockType,
	getBlockType,
} from '@wordpress/blocks';
import BlockPopover from '../index';
import BlockList from '../../block-list';
import { ExperimentalBlockEditorProvider } from '../../provider';

// A minimal block type, so that the story doesn't depend on the block library.
const BLOCK_NAME = 'storybook/example';

if ( ! getBlockType( BLOCK_NAME ) ) {
	registerBlockType( BLOCK_NAME, {
		title: 'Example',
		category: 'text',
		attributes: {
			content: { type: 'string' },
		},
		edit: ( { attributes } ) => attributes.content,
		save: () => null,
	} );
}

// The client IDs are hardcoded instead of using the generated ones, so that a
// client ID picked in the controls is still valid after a page reload.
const blocks = [ 'First', 'Second', 'Third' ].map( ( label, index ) => ( {
	...createBlock( BLOCK_NAME, { content: `${ label } example block.` } ),
	clientId: `example-block-${ index + 1 }`,
} ) );

// Makes the blocks and the popover distinguishable from each other, so that it
// is easier to see which block the popover is anchored to.
const storyStyles = `
	.block-popover-story {
		position: relative;
		padding: 48px 0;
	}
	.block-popover-story .block-editor-block-list__block {
		border: 1px dashed #949494;
		padding: 8px;
		margin-bottom: 16px;
	}
	.block-popover-story .block-editor-block-popover .components-popover__content {
		background: #fff;
		border: 1px solid #1e1e1e;
		padding: 8px;
	}
`;

const clientIdOptions = blocks.map( ( block ) => block.clientId );
const clientIdLabels = Object.fromEntries(
	blocks.map( ( block, index ) => [ block.clientId, `Block ${ index + 1 }` ] )
);

/**
 * BlockPopover renders editor UI by the block in a popover, positioned outside
 * the canvas so that it doesn't interfere with the block list layout.
 *
 * The popover is anchored to the block matching `clientId`, so that block has
 * to be rendered by a block list within a block editor provider. When a
 * `bottomClientId` is passed as well, the popover is anchored to the area
 * covered by both blocks.
 */
const meta = {
	title: 'BlockEditor/BlockPopover',
	component: BlockPopover,
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
	},
	decorators: [
		( Story ) => (
			<ExperimentalBlockEditorProvider value={ blocks }>
				<style>{ storyStyles }</style>
				<div className="block-popover-story">
					<BlockList />
					<Story />
				</div>
			</ExperimentalBlockEditorProvider>
		),
	],
	argTypes: {
		clientId: {
			control: { type: 'select', labels: clientIdLabels },
			options: clientIdOptions,
			description:
				'The client ID of the block representing the top position of the popover.',
		},
		bottomClientId: {
			control: { type: 'select', labels: clientIdLabels },
			options: clientIdOptions,
			description:
				'The client ID of the block representing the bottom position of the popover.',
		},
		shift: {
			control: { type: 'boolean' },
			description:
				'Determines whether the block popover always shifts into the viewport or remains at its original position.',
		},
		children: {
			control: { type: 'text' },
			description: 'The content rendered inside the popover.',
		},
	},
};

export default meta;

export const Default = {
	args: {
		clientId: blocks[ 1 ].clientId,
		children: 'This is a block popover example.',
		shift: true,
	},
};

/**
 * Passing a `bottomClientId` anchors the popover to the area covered by both
 * blocks, instead of the single block passed as `clientId`.
 */
export const SpanningMultipleBlocks = {
	args: {
		...Default.args,
		clientId: blocks[ 0 ].clientId,
		bottomClientId: blocks[ 2 ].clientId,
		children: 'This popover spans multiple blocks.',
	},
};
