/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const NON_DISABLED_EDITING_MODES = [ 'default', 'contentOnly' ];

export default function useListViewClientIds( { blocks, rootClientId } ) {
	return useSelect(
		( select ) => {
			const {
				getDraggedBlockClientIds,
				getSelectedBlockClientIds,
				getClientIdsTreeWithBlockEditingMode,
			} = unlock( select( blockEditorStore ) );

			return {
				selectedClientIds: getSelectedBlockClientIds(),
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree:
					blocks ??
					getClientIdsTreeWithBlockEditingMode(
						NON_DISABLED_EDITING_MODES,
						rootClientId
					),
			};
		},
		[ blocks, rootClientId ]
	);
}
