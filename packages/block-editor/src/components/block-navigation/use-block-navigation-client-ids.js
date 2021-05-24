/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isClientIdSelected } from './utils';
import { store as blockEditorStore } from '../../store';

const useBlockNavigationSelectedClientIds = (
	__experimentalPersistentListViewFeatures
) =>
	useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				getSelectedBlockClientIds,
			} = select( blockEditorStore );

			if ( __experimentalPersistentListViewFeatures ) {
				return getSelectedBlockClientIds();
			}

			return getSelectedBlockClientId();
		},
		[ __experimentalPersistentListViewFeatures ]
	);

const useBlockNavigationClientIdsTree = (
	blocks,
	selectedClientIds,
	showOnlyCurrentHierarchy
) =>
	useSelect(
		( select ) => {
			const {
				getBlockHierarchyRootClientId,
				__unstableGetClientIdsTree,
				__unstableGetClientIdWithClientIdsTree,
			} = select( blockEditorStore );

			if ( blocks ) {
				return blocks;
			}

			const isSingleBlockSelected =
				selectedClientIds && ! Array.isArray( selectedClientIds );
			if ( ! showOnlyCurrentHierarchy || ! isSingleBlockSelected ) {
				return __unstableGetClientIdsTree();
			}

			const rootBlock = __unstableGetClientIdWithClientIdsTree(
				getBlockHierarchyRootClientId( selectedClientIds )
			);
			if ( ! rootBlock ) {
				return __unstableGetClientIdsTree();
			}

			const hasHierarchy =
				! isClientIdSelected( rootBlock.clientId, selectedClientIds ) ||
				( rootBlock.innerBlocks && rootBlock.innerBlocks.length !== 0 );
			if ( hasHierarchy ) {
				return [ rootBlock ];
			}

			return __unstableGetClientIdsTree();
		},
		[ blocks, selectedClientIds, showOnlyCurrentHierarchy ]
	);

export default function useBlockNavigationClientIds(
	blocks,
	showOnlyCurrentHierarchy,
	__experimentalPersistentListViewFeatures
) {
	const selectedClientIds = useBlockNavigationSelectedClientIds(
		__experimentalPersistentListViewFeatures
	);
	const clientIdsTree = useBlockNavigationClientIdsTree(
		blocks,
		selectedClientIds,
		showOnlyCurrentHierarchy
	);
	return { clientIdsTree, selectedClientIds };
}
