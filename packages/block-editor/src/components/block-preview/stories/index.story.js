/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import BlockPreview from '..';
import { BlockEditorProvider } from '../../provider';

// Register core blocks to be used in the preview.
registerCoreBlocks();

// Sample blocks for the story.
const sampleBlocks = [
	createBlock( 'core/heading', {
		content: 'This is a heading block.',
		level: 2,
	} ),
	createBlock( 'core/paragraph', { content: 'This is a paragraph block.' } ),
];

const meta = {
	title: 'BlockEditor/BlockPreview',
	component: BlockPreview,
	parameters: {
		docs: {
			description: {
				component:
					'The `BlockPreview` component renders a preview of blocks in an isolated editor environment.',
			},
		},
	},
	argTypes: {
		blocks: {
			description: 'Block instance(s) to render in the preview.',
			control: 'object',
			table: {
				type: {
					summary: 'Array|Object',
				},
			},
		},
		viewportWidth: {
			description: 'Width of the preview container in pixels.',
			control: 'number',
			table: {
				type: {
					summary: 'number',
				},
			},
			defaultValue: 1200,
		},
		minHeight: {
			description: 'Minimum height of the preview iframe in pixels.',
			control: 'number',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		additionalStyles: {
			description:
				'Additional styles to apply to the preview iframe as an array of CSS rules. Each object should contain a `css` attribute.',
			control: 'object',
			table: {
				type: {
					summary: 'Array',
				},
			},
			defaultValue: [],
		},
	},
};
export default meta;

export const Default = {
	render: function Template( args ) {
		return (
			<BlockEditorProvider settings={ { styles: [] } }>
				<BlockPreview { ...args } />
			</BlockEditorProvider>
		);
	},
	args: {
		blocks: sampleBlocks,
		viewportWidth: 1200,
		minHeight: 100,
		additionalStyles: [],
	},
};

export const CustomStyles = {
	render: function Template( args ) {
		return (
			<BlockEditorProvider settings={ { styles: [] } }>
				<BlockPreview { ...args } />
			</BlockEditorProvider>
		);
	},
	args: {
		blocks: sampleBlocks,
		viewportWidth: 1200,
		minHeight: 100,
		additionalStyles: [ { css: `p { color: #ff0000; }` } ],
	},
};
