import {
	createBlock,
	registerBlockType,
	getBlockType,
} from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import BlockPopover from '../';
import BlockList from '../../block-list';
import { ExperimentalBlockEditorProvider } from '../../provider';

// A minimal block type, so that the story doesn't depend on the block library.
const BLOCK_NAME = 'storybook/example';
const BLOCK_LABELS = [ 'First', 'Second', 'Third' ];

// The client IDs are hardcoded instead of using the generated ones, so that a
// client ID picked in the controls is still valid after a page reload.
const clientIds = BLOCK_LABELS.map(
	( label, index ) => `example-block-${ index + 1 }`
);

// Registered when the story renders rather than when this file loads, so that
// the example block type doesn't leak into the registry shared with the other
// stories.
function useExampleBlocks() {
	return useMemo( () => {
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

		return BLOCK_LABELS.map( ( label, index ) => ( {
			...createBlock( BLOCK_NAME, {
				content: `${ label } example block.`,
			} ),
			clientId: clientIds[ index ],
		} ) );
	}, [] );
}

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

const clientIdLabels = Object.fromEntries(
	clientIds.map( ( clientId, index ) => [ clientId, `Block ${ index + 1 }` ] )
);

const meta = {
	title: 'BlockEditor/BlockPopover',
	component: BlockPopover,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					"BlockPopover renders editor UI by the block in a popover, positioned outside the canvas so that it doesn't interfere with the block list layout. The popover is anchored to the block matching `clientId`, so that block has to be rendered by a block list within a block editor provider. When a `bottomClientId` is passed as well, the popover is anchored to the area covered by both blocks.",
			},
		},
	},
	decorators: [
		( Story ) => {
			const blocks = useExampleBlocks();

			return (
				<ExperimentalBlockEditorProvider value={ blocks }>
					<style>{ storyStyles }</style>
					<div className="block-popover-story">
						<BlockList />
						<Story />
					</div>
				</ExperimentalBlockEditorProvider>
			);
		},
	],
	argTypes: {
		clientId: {
			control: { type: 'select', labels: clientIdLabels },
			options: clientIds,
			description:
				'The client ID of the block representing the top position of the popover.',
			type: { name: 'string', required: true },
			table: {
				type: { summary: 'string' },
			},
		},
		bottomClientId: {
			control: { type: 'select', labels: clientIdLabels },
			options: clientIds,
			description:
				'The client ID of the block representing the bottom position of the popover.',
			table: {
				type: { summary: 'string' },
			},
		},
		shift: {
			control: { type: 'boolean' },
			description:
				'Determines whether the block popover always shifts into the viewport or remains at its original position.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		children: {
			control: { type: 'text' },
			description: 'The content rendered inside the popover.',
			table: {
				type: { summary: 'ReactNode' },
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		clientId: clientIds[ 1 ],
		children: 'This is a block popover example.',
	},
};
