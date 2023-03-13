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

function Provider( { children } ) {
	const wrapperStyle = { margin: '24px', position: 'relative' };

	return (
		<div style={ wrapperStyle }>
			<ExperimentalBlockEditorProvider value={ blocks }>
				{ children }
			</ExperimentalBlockEditorProvider>
		</div>
	);
}

function BlockMoverStory() {
	const { updateBlockListSettings } = useDispatch( blockEditorStore );

	useEffect( () => {
		/**
		 * This shouldn't be needed but unfortunatley
		 * the layout orientation is not declarative, we need
		 *  to render the blocks to update the block settings in the state.
		 */
		updateBlockListSettings( blocks[ 1 ].clientId, {
			orientation: 'horizontal',
		} );
	}, [] );

	return (
		<div>
			<p>The mover by default is vertical</p>
			<Toolbar label="Block Mover">
				<BlockMover
					clientIds={
						blocks.length
							? [ blocks[ 0 ].innerBlocks[ 1 ].clientId ]
							: []
					}
				/>
			</Toolbar>

			<p style={ { marginTop: 36 } }>
				But it can also accommodate horizontal blocks.
			</p>
			<Toolbar label="Block Mover">
				<BlockMover
					clientIds={
						blocks.length
							? [ blocks[ 1 ].innerBlocks[ 1 ].clientId ]
							: []
					}
				/>
			</Toolbar>

			<p style={ { marginTop: 36 } }>We can also hide the drag handle.</p>
			<Toolbar label="Block Mover">
				<BlockMover
					clientIds={
						blocks.length
							? [ blocks[ 1 ].innerBlocks[ 0 ].clientId ]
							: []
					}
					hideDragHandle
				/>
			</Toolbar>
		</div>
	);
}

export default {
	title: 'BlockEditor/BlockMover',
};

export const _default = () => {
	return (
		<Provider>
			<BlockMoverStory />
		</Provider>
	);
};
