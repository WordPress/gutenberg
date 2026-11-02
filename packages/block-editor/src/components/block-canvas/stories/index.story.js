/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	BlockCanvas,
	BlockEditorProvider,
	BlockToolbar,
} from '@wordpress/block-editor';

const meta = {
	title: 'BlockEditor/BlockCanvas',
	component: BlockCanvas,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The BlockCanvas component is used to render the canvas for the block editor.',
			},
		},
	},
	decorators: [
		( Story ) => {
			const [ blocks, updateBlocks ] = useState( [] );

			useEffect( () => {
				registerCoreBlocks();
			}, [] );

			return (
				<BlockEditorProvider
					value={ blocks }
					onInput={ ( newBlocks ) => updateBlocks( newBlocks ) }
					onChange={ ( newBlocks ) => updateBlocks( newBlocks ) }
				>
					<BlockToolbar hideDragHandle />
					<Story />
				</BlockEditorProvider>
			);
		},
	],
	argTypes: {
		children: {
			control: false,
			description: 'The children to render in the canvas.',
			table: {
				type: { summary: 'node' },
				defaultValue: { summary: 'BlockList' },
			},
		},
		height: {
			control: 'text',
			description: 'The height of the canvas.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: '300px' },
			},
		},
		styles: {
			control: 'object',
			description: 'The styles to apply to the canvas.',
			table: {
				type: { summary: 'Array' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: ( args ) => <BlockCanvas { ...args } />,
};
