/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { default as fetchLinkSuggestions } from './__experimental-fetch-link-suggestions';

export const __experimentalFetchLinkSuggestions = fetchLinkSuggestions;
export { default as __experimentalFetchUrlData } from './__experimental-fetch-url-data';

export function __experimentalUseLinkControlEntitySearch() {
	const settings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	// The function should either be undefined or a stable function reference
	// throughout the editor lifetime, much like importing a function from a
	// module.
	const { pageOnFront, pageForPosts } = useSelect( ( select ) => {
		const { canUser, getEntityRecord } = select( coreStore );

		const siteSettings = canUser( 'read', 'settings' )
			? getEntityRecord( 'root', 'site' )
			: undefined;

		return {
			pageOnFront: siteSettings?.page_on_front,
			pageForPosts: siteSettings?.page_for_posts,
		};
	}, [] );

	return useCallback(
		async ( val, suggestionsQuery ) => {
			return (
				await fetchLinkSuggestions( val, suggestionsQuery, settings )
			).map( ( result ) => {
				if ( Number( result.id ) === pageOnFront ) {
					result.isFrontPage = true;
					return result;
				} else if ( Number( result.id ) === pageForPosts ) {
					result.isBlogHome = true;
					return result;
				}

				return result;
			} );
		},
		[ pageOnFront, pageForPosts, settings ]
	);
}
