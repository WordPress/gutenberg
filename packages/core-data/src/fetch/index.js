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
		async ( val, suggestionsQuery, withCreateSuggestion ) => {
			const { isInitialSuggestions } = suggestionsQuery;

			const results = await fetchLinkSuggestions(
				val,
				suggestionsQuery,
				settings
			);

			// Identify front page and update type to match.
			results.map( ( result ) => {
				if ( Number( result.id ) === pageOnFront ) {
					result.isFrontPage = true;
					return result;
				} else if ( Number( result.id ) === pageForPosts ) {
					result.isBlogHome = true;
					return result;
				}

				return result;
			} );

			// If displaying initial suggestions just return plain results.
			if ( isInitialSuggestions ) {
				return results;
			}

			// Here we append a faux suggestion to represent a "CREATE" option. This
			// is detected in the rendering of the search results and handled as a
			// special case. This is currently necessary because the suggestions
			// dropdown will only appear if there are valid suggestions and
			// therefore unless the create option is a suggestion it will not
			// display in scenarios where there are no results returned from the
			// API. In addition promoting CREATE to a first class suggestion affords
			// the a11y benefits afforded by `URLInput` to all suggestions (eg:
			// keyboard handling, ARIA roles...etc).
			//
			// Note also that the value of the `title` and `url` properties must correspond
			// to the text value of the `<input>`. This is because `title` is used
			// when creating the suggestion. Similarly `url` is used when using keyboard to select
			// the suggestion (the <form> `onSubmit` handler falls-back to `url`).
			return ! withCreateSuggestion
				? results
				: results.concat( {
						// the `id` prop is intentionally ommitted here because it
						// is never exposed as part of the component's public API.
						// see: https://github.com/WordPress/gutenberg/pull/19775#discussion_r378931316.
						title: val, // Must match the existing `<input>`s text value.
						url: val, // Must match the existing `<input>`s text value.
						type: '__CREATE__',
				  } );
		},
		[ pageOnFront, pageForPosts, settings ]
	);
}
