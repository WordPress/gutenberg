/**
 * External dependencies
 */
import { first, last } from 'lodash';

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
	clientId,
	isSelecting,
	isFirst,
	isLast,
} ) {
	if ( isSelecting ) {
		return null;
	}

	return <BlockMover
		clientId={ clientId }
		clientIds={ multiSelectedBlockClientIds }
		isFirst={ isFirst }
		isLast={ isLast }
	/>;
}

export default withSelect( ( select, { clientId } ) => {
	const {
		getMultiSelectedBlockClientIds,
		isMultiSelecting,
		getBlockIndex,
		getBlockCount,
	} = select( 'core/editor' );
	const clientIds = getMultiSelectedBlockClientIds();
	const firstIndex = getBlockIndex( first( clientIds ), clientId );
	const lastIndex = getBlockIndex( last( clientIds ), clientId );

	return {
		multiSelectedBlockClientIds: clientIds,
		isSelecting: isMultiSelecting(),
		isFirst: firstIndex === 0,
		isLast: lastIndex + 1 === getBlockCount(),
	};
} )( BlockListMultiControls );
