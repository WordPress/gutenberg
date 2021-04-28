/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isClientIdSelected } from './utils';
import { store as blockEditorStore } from '../../store';

export default function useBlockNavigationClientIds(
	blocks,
	showOnlyCurrentHierarchy,
	selectedBlockClientIds,
	__experimentalPersistentListViewFeatures
) {
	return useSelect(
		( select ) => {
			const {
				getBlockHierarchyRootClientId,
				getSelectedBlockClientId,
				getSelectedBlockClientIds,
				__unstableGetClientIdsTree,
				__unstableGetClientIdWithClientIdsTree,
			} = select( blockEditorStore );

			let selectedClientIds;
			if ( selectedBlockClientIds ) {
				selectedClientIds = selectedBlockClientIds;
			} else if ( __experimentalPersistentListViewFeatures ) {
				selectedClientIds = getSelectedBlockClientIds();
			} else {
				selectedClientIds = getSelectedBlockClientId();
			}

			let clientIdsTree = blocks;
			if ( blocks ) {
				clientIdsTree = blocks;
			} else if ( ! showOnlyCurrentHierarchy ) {
				clientIdsTree = __unstableGetClientIdsTree();
			} else {
				const rootBlock =
					selectedClientIds && ! Array.isArray( selectedClientIds )
						? __unstableGetClientIdWithClientIdsTree(
								getBlockHierarchyRootClientId(
									selectedClientIds
								)
						  )
						: null;
				const hasHierarchy =
					rootBlock &&
					( ! isClientIdSelected(
						rootBlock.clientId,
						selectedClientIds
					) ||
						( rootBlock.innerBlocks &&
							rootBlock.innerBlocks.length !== 0 ) );
				clientIdsTree = hasHierarchy
					? [ rootBlock ]
					: __unstableGetClientIdsTree();
			}

			if ( ! Array.isArray( selectedClientIds ) ) {
				selectedClientIds = [ selectedClientIds ];
			}

			return { clientIdsTree, selectedClientIds };
		},
		[
			blocks,
			showOnlyCurrentHierarchy,
			selectedBlockClientIds,
			__experimentalPersistentListViewFeatures,
		]
	);
}
