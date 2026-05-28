import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function filterListViewBlocks( blocks, getBlockName ) {
	return blocks.flatMap( ( block ) => {
		if (
			! hasBlockSupport(
				getBlockName( block.clientId ),
				'listView',
				true
			)
		) {
			return [];
		}

		return {
			...block,
			innerBlocks: filterListViewBlocks(
				block.innerBlocks,
				getBlockName
			),
		};
	} );
}

export default function useListViewClientIds( { blocks, rootClientId } ) {
	return useSelect(
		( select ) => {
			const {
				getDraggedBlockClientIds,
				getBlockName,
				getSelectedBlockClientIds,
				getListViewClientIdsTree,
			} = unlock( select( blockEditorStore ) );
			const clientIdsTree =
				blocks ?? getListViewClientIdsTree( rootClientId );

			return {
				selectedClientIds: getSelectedBlockClientIds(),
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree: filterListViewBlocks(
					clientIdsTree,
					getBlockName
				),
			};
		},
		[ blocks, rootClientId ]
	);
}
