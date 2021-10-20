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
				getSelectedBlockClientIds,
				getBlockParents,
			} = select( blockEditorStore );
			const selectedBlockClientIds = getSelectedBlockClientIds();

			return {
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree: blocks ? blocks : __unstableGetClientIdsTree(),
				selectedBlockParentIds: getBlockParents(
					selectedBlockClientIds[ 0 ],
					false
				),
			};
		},
		[ blocks ]
	);
}
