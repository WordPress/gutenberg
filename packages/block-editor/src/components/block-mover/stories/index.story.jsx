/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { useDispatch } from '@wordpress/data';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockMover from '../';
import { ExperimentalBlockEditorProvider } from '../../provider';
import { store as blockEditorStore } from '../../../store';

// For the purpose of this story, we need to register the core blocks samples.
registerCoreBlocks();
const blocks = [
	// vertical
	createBlock( 'core/group', { layout: { type: 'flex' } }, [
		createBlock( 'core/paragraph' ),
		createBlock( 'core/paragraph' ),
		createBlock( 'core/paragraph' ),
	] ),
	// horizontal
	createBlock( 'core/buttons', {}, [
		createBlock( 'core/button' ),
		createBlock( 'core/button' ),
		createBlock( 'core/button' ),
	] ),
];

/**
 * BlockMover component allows moving blocks inside the editor using up and down buttons.
 */
const meta = {
	title: 'BlockEditor/BlockMover',
	component: BlockMover,
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
	},
	decorators: [
		( Story ) => (
			<ExperimentalBlockEditorProvider value={ blocks }>
				<Toolbar label="Block Mover">
					<Story />
				</Toolbar>
			</ExperimentalBlockEditorProvider>
		),
	],
	argTypes: {
		clientIds: {
			control: {
				type: 'none',
			},
			description: 'The client IDs of the blocks to move.',
		},
		hideDragHandle: {
			control: {
				type: 'boolean',
			},
			description: 'If this property is true, the drag handle is hidden.',
		},
	},
};
export default meta;

export const Default = {
	args: {
		clientIds: [ blocks[ 0 ].innerBlocks[ 1 ].clientId ],
	},
};

/**
 * This story shows the block mover with horizontal orientation.
 * It is necessary to render the blocks to update the block settings in the state.
 */
export const Horizontal = {
	decorators: [
		( Story ) => {
			const { updateBlockListSettings } = useDispatch( blockEditorStore );
			useEffect( () => {
				/**
				 * This shouldn't be needed but unfortunately
				 * the layout orientation is not declarative, we need
				 * to render the blocks to update the block settings in the state.
				 */
				updateBlockListSettings( blocks[ 1 ].clientId, {
					orientation: 'horizontal',
				} );
			}, [] );
			return <Story />;
		},
	],
	args: {
		clientIds: [ blocks[ 1 ].innerBlocks[ 1 ].clientId ],
	},
	parameters: {
		docs: { canvas: { sourceState: 'hidden' } },
	},
};

/**
 * You can hide the drag handle by `hideDragHandle` attribute.
 */
export const HideDragHandle = {
	args: {
		...Default.args,
		hideDragHandle: true,
	},
};
