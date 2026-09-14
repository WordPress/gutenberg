import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

export function useGetNumberOfBlocksBeforeCell( gridClientId, numColumns ) {
	const { getBlockOrder, getBlockAttributes } = useSelect( blockEditorStore );

	const getNumberOfBlocksBeforeCell = ( column, row ) => {
		const targetIndex = ( row - 1 ) * numColumns + column - 1;

		let count = 0;
		const blockOrder = getBlockOrder( gridClientId );
		for ( let i = 0; i < blockOrder.length; i++ ) {
			const clientId = blockOrder[ i ];
			const { columnStart, rowStart } =
				getBlockAttributes( clientId )?.style?.layout ?? {};
			const cellIndex =
				columnStart && rowStart
					? ( rowStart - 1 ) * numColumns + columnStart - 1
					: i;
			if ( cellIndex < targetIndex ) {
				count++;
			}
		}
		return count;
	};

	return getNumberOfBlocksBeforeCell;
}
