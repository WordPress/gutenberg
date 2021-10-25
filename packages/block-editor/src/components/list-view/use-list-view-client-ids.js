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
				getSelectedBlockClientIds,
				__unstableGetClientIdsTree,
				getSelectedBlockClientIds,
				getBlockParents,
			} = select( blockEditorStore );
			const selectedBlockClientIds = getSelectedBlockClientIds();

			return {
				selectedClientIds: getSelectedBlockClientIds(),
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree: blocks ? blocks : __unstableGetClientIdsTree(),
				selectedBlockParentClientIds: getBlockParents(
					selectedBlockClientIds[ 0 ],
					false
				),
			};
		},
		[ blocks ]
	);
}
