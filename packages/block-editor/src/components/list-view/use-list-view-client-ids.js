/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const useListViewClientIdsTree = ( blocks, showOnlyCurrentHierarchy ) =>
	useSelect(
		( select ) => {
			if ( blocks ) {
				return blocks;
			}

			const { __unstableGetClientIdsTree } = select( blockEditorStore );

			return __unstableGetClientIdsTree();
		},
		[ blocks, showOnlyCurrentHierarchy ]
	);

export default function useListViewClientIds(
	blocks,
	showOnlyCurrentHierarchy,
	__experimentalPersistentListViewFeatures
) {
	const { draggedClientIds } = useSelect(
		( select ) => {
			const { getDraggedBlockClientIds } = select( blockEditorStore );

			if ( __experimentalPersistentListViewFeatures ) {
				return {
					draggedClientIds: getDraggedBlockClientIds(),
				};
			}

			return {
				draggedClientIds: getDraggedBlockClientIds(),
			};
		},
		[ __experimentalPersistentListViewFeatures ]
	);
	const clientIdsTree = useListViewClientIdsTree(
		blocks,
		showOnlyCurrentHierarchy
	);
	return { clientIdsTree, draggedClientIds };
}
