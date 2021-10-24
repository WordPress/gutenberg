/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useListViewClientIds( blocks ) {
	return useSelect(
		( select ) => {
			const {
				getDraggedBlockClientIds,
				__unstableGetClientIdsTree,
			} = select( blockEditorStore );

			return {
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree: blocks ? blocks : __unstableGetClientIdsTree(),
			};
		},
		[ blocks ]
	);
}
