/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useGetBlocksBeforeCurrentCell(
	clientId,
	numColumns,
	isGrid = true
) {
	const { getBlockAttributes, getBlockOrder } = useSelect( blockEditorStore );

	if ( ! isGrid ) {
		return () => null;
	}

	return ( targetIndex ) => {
		const gridBlockOrder = getBlockOrder( clientId );
		const getBlockPositions = gridBlockOrder.map( ( blockClientId ) => {
			const attributes = getBlockAttributes( blockClientId );
			const { columnStart, rowStart } = attributes.style?.layout || {};
			// If flow direction ever becomes settable this will have to change.
			return ( rowStart - 1 ) * numColumns + columnStart - 1;
		} );
		const blocksBefore = getBlockPositions.filter(
			( position ) => position < targetIndex
		);
		return blocksBefore.length;
	};
}
