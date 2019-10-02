/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';

function BlockListMultiControls( {
	multiSelectedBlockClientIds,
	isSelecting,
	moverOptions,
} ) {
	if ( isSelecting ) {
		return null;
	}

	return (
		<BlockMover
			clientIds={ multiSelectedBlockClientIds }
			moverOptions={ moverOptions }
		/>
	);
}

export default withSelect( ( select ) => {
	const {
		getMultiSelectedBlockClientIds,
		isMultiSelecting,
	} = select( 'core/block-editor' );
	const clientIds = getMultiSelectedBlockClientIds();

	return {
		multiSelectedBlockClientIds: clientIds,
		isSelecting: isMultiSelecting(),
	};
} )( BlockListMultiControls );
