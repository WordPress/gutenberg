/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useGetBlocksBeforeCurrentCell( clientId, gridInfo ) {
	const { getBlockAttributes, getBlockOrder } = useSelect( blockEditorStore );
	const gridBlockOrder = getBlockOrder( clientId );

	const getBlockPositions = gridBlockOrder.map( ( blockClientId ) => {
		const attributes = getBlockAttributes( blockClientId );
		const { columnStart, rowStart } = attributes.style?.layout || {};
		// If flow direction ever becomes settable this will have to change.
		return ( rowStart - 1 ) * gridInfo.numColumns + columnStart - 1;
	} );

	return ( targetIndex ) => {
		const blocksBefore = getBlockPositions.filter(
			( position ) => position < targetIndex
		);
		return blocksBefore.length;
	};
}
