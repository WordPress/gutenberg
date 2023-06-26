/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function useListViewClientIds( { blocks, rootClientId } ) {
	return useSelect(
		( select ) => {
			const {
				getDraggedBlockClientIds,
				getSelectedBlockClientIds,
				getListViewClientIdsTree,
			} = unlock( select( blockEditorStore ) );

			return {
				selectedClientIds: getSelectedBlockClientIds(),
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree:
					blocks ?? getListViewClientIdsTree( rootClientId ),
			};
		},
		[ blocks, rootClientId ]
	);
}
