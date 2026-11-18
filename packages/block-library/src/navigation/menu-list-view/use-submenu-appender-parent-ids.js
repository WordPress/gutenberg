import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

const EMPTY_ARRAY = [];

/**
 * Returns the client ids of the submenus that should show their own add
 * button row (#86178).
 *
 * Only the submenu being worked on gets one: the selected submenu, or the
 * submenu holding the selected item. Showing one under every submenu (or
 * every empty one) stacked up add buttons. Elsewhere, a submenu's items can
 * still be added from its options menu, or by dragging.
 *
 * @param {?string} navigationClientId Client id of the Navigation block.
 * @return {string[]} Client ids.
 */
export default function useSubmenuAppenderParentIds( navigationClientId ) {
	const activeSubmenuId = useActiveSubmenuId( navigationClientId );
	return useMemo(
		() => ( activeSubmenuId ? [ activeSubmenuId ] : EMPTY_ARRAY ),
		[ activeSubmenuId ]
	);
}

/**
 * The client id of the sub menu being worked on: the selected sub menu, or the
 * sub menu holding the selected item.
 *
 * @param {?string} navigationClientId Client id of the Navigation block.
 * @return {?string} Client id, or null.
 */
export function useActiveSubmenuId( navigationClientId ) {
	return useSelect(
		( select ) => {
			if ( ! navigationClientId ) {
				return null;
			}
			const {
				getSelectedBlockClientId,
				getBlockName,
				getBlockRootClientId,
				getBlockParents,
			} = select( blockEditorStore );
			const selectedClientId = getSelectedBlockClientId();
			if (
				! selectedClientId ||
				! getBlockParents( selectedClientId ).includes(
					navigationClientId
				)
			) {
				return null;
			}
			if (
				getBlockName( selectedClientId ) === 'core/navigation-submenu'
			) {
				return selectedClientId;
			}
			const parentClientId = getBlockRootClientId( selectedClientId );
			return getBlockName( parentClientId ) === 'core/navigation-submenu'
				? parentClientId
				: null;
		},
		[ navigationClientId ]
	);
}
