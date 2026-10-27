import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { ClientIdsTreeNode } from '../../store/types';

export default function useListViewClientIds( {
	blocks,
	rootClientId,
}: {
	blocks?: ClientIdsTreeNode[];
	rootClientId?: string | null;
} ): {
	selectedClientIds: string[];
	draggedClientIds: string[];
	clientIdsTree: ClientIdsTreeNode[];
} {
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
