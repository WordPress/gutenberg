import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Returns whether a Navigation block is a pages menu: its only item is a
 * Page List. A pages menu lists the site's pages and nothing else. Its pages
 * can be reordered and shown or hidden, and to add anything else, it's
 * switched to an advanced menu, of links.
 *
 * @param clientId Client ID of the Navigation block.
 * @return Whether it's a pages menu.
 */
export function useIsPagesOnlyMenu( clientId?: string | null ): boolean {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return false;
			}
			const { getBlockOrder, getBlockName } = select( blockEditorStore );
			const order = getBlockOrder( clientId );
			return (
				order.length === 1 &&
				getBlockName( order[ 0 ] ) === 'core/page-list'
			);
		},
		[ clientId ]
	);
}
