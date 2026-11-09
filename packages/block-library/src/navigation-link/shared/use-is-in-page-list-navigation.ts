import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getSuggestionsQuery } from '../../utils/link-picker';
import type { SuggestionsQuery } from '../../utils/link-picker';

/**
 * Whether a block is inside a Navigation block that contains a Page List.
 * The Page List manages that menu's pages, so the menu's other items can't
 * link to a page.
 *
 * @param clientId Client ID of a block in the Navigation.
 * @return Whether the Navigation contains a Page List.
 */
export function useIsInPageListNavigation( clientId?: string ): boolean {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return false;
			}
			const {
				getBlockParentsByBlockName,
				getClientIdsOfDescendants,
				getBlockName,
			} = select( blockEditorStore );
			const [ navigationClientId ] = getBlockParentsByBlockName(
				clientId,
				'core/navigation',
				true
			);
			if ( ! navigationClientId ) {
				return false;
			}
			return getClientIdsOfDescendants( navigationClientId ).some(
				( id: string ) => getBlockName( id ) === 'core/page-list'
			);
		},
		[ clientId ]
	);
}

/**
 * Removes pages from link suggestions.
 *
 * @param suggestions Link suggestions.
 * @return The suggestions that aren't pages.
 */
export function removePageSuggestions< T extends { type?: string } >(
	suggestions: T[]
): T[] {
	return suggestions.filter( ( suggestion ) => suggestion.type !== 'page' );
}

/**
 * Returns the suggestions query for a link, leaving pages out when the
 * Navigation's Page List manages them. A Page Link, or a custom link, which
 * would otherwise suggest pages, suggests posts instead.
 *
 * @param type         The link's type attribute.
 * @param kind         The link's kind attribute.
 * @param excludePages Whether to leave pages out.
 * @return The suggestions query.
 */
export function getLinkSuggestionsQuery(
	type: string | undefined,
	kind: string | undefined,
	excludePages: boolean
): SuggestionsQuery {
	if ( excludePages && ( ! type || type === 'page' ) ) {
		return getSuggestionsQuery( 'post', 'post-type' );
	}
	return getSuggestionsQuery( type, kind );
}
