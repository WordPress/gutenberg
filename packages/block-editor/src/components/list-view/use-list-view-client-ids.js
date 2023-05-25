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
				__unstableGetClientIdsTree,
				getBlockEditingMode,
			} = unlock( select( blockEditorStore ) );

			const removeDisabledBlocks = ( tree ) => {
				return tree.flatMap( ( { clientId, innerBlocks, ...rest } ) => {
					if ( getBlockEditingMode( clientId ) === 'disabled' ) {
						return removeDisabledBlocks( innerBlocks );
					}
					return [
						{
							clientId,
							innerBlocks: removeDisabledBlocks( innerBlocks ),
							...rest,
						},
					];
				} );
			};

			return {
				selectedClientIds: getSelectedBlockClientIds(),
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree: removeDisabledBlocks(
					blocks ?? __unstableGetClientIdsTree( rootClientId )
				),
			};
		},
		[ blocks, rootClientId ]
	);
}
