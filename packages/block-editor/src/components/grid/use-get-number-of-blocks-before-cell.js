/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useGetNumberOfBlocksBeforeCell( gridClientId, numColumns ) {
	const { getBlockOrder, getBlockAttributes } = useSelect( blockEditorStore );

	const getNumberOfBlocksBeforeCell = ( column, row ) => {
		const targetIndex = ( row - 1 ) * numColumns + column - 1;

		let count = 0;
		for ( const clientId of getBlockOrder( gridClientId ) ) {
			const { columnStart, rowStart } =
				getBlockAttributes( clientId ).style?.layout ?? {};
			const cellIndex = ( rowStart - 1 ) * numColumns + columnStart - 1;
			if ( cellIndex < targetIndex ) {
				count++;
			}
		}
		return count;
	};

	return getNumberOfBlocksBeforeCell;
}
