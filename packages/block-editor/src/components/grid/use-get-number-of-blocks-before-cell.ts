import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import type { GridItemAttributes } from './types';

export function useGetNumberOfBlocksBeforeCell(
	gridClientId: string | null,
	numColumns: number
) {
	const { getBlockOrder, getBlockAttributes } = useSelect( blockEditorStore );

	const getNumberOfBlocksBeforeCell = ( column: number, row: number ) => {
		const targetIndex = ( row - 1 ) * numColumns + column - 1;

		let count = 0;
		for ( const clientId of getBlockOrder( gridClientId ) ) {
			const { columnStart, rowStart } =
				// The grid items exist.
				( getBlockAttributes( clientId ) as GridItemAttributes ).style
					?.layout ?? {};
			// Items of a manual grid have a position.
			const cellIndex = ( rowStart! - 1 ) * numColumns + columnStart! - 1;
			if ( cellIndex < targetIndex ) {
				count++;
			}
		}
		return count;
	};

	return getNumberOfBlocksBeforeCell;
}
