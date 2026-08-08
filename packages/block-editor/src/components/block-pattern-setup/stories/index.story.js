/**
 * Internal dependencies
 */
import BlockPatternSetup from '..';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock } from '@wordpress/blocks';

registerCoreBlocks();
const block = createBlock( 'core/paragraph', {
	content: 'Sample paragraph content',
} );

/**
 * Storybook metadata
 */
const meta = {
	title: 'Components/BlockPatternSetup',
	component: BlockPatternSetup,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'BlockPatternSetup component displays a list of block patterns in a carousel or grid view.',
			},
		},
	},
	argTypes: {
		clientId: {
			control: { type: null },
			description: 'The client ID of the block being edited.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		blockName: {
			control: {
				type: 'text',
			},
			description: 'The name of the block being edited.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		filterPatternsFn: {
			control: { type: null },
			description: 'Function to filter patterns.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		onBlockPatternSelect: {
			control: { type: null },
			description: 'Function to call when a pattern is selected.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		initialViewMode: {
			control: {
				type: 'text',
			},
			description: 'The initial view mode for the block pattern setup.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		showTitles: {
			control: {
				type: 'boolean',
			},
			description: 'Whether to show titles for block patterns.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
	},
};

export default meta;

/**
 * Default story for the BlockPatternSetup component
 */
export const Default = {
	args: {
		clientId: block.clientId,
		blockName: 'core/paragraph',
		filterPatternsFn: null,
		onBlockPatternSelect: () => {},
		initialViewMode: 'carousel',
		showTitles: true,
	},
	render: function Template( args ) {
		return <BlockPatternSetup { ...args } />;
	},
};
