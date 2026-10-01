import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import isURLLike from './is-url-like';
import normalizeUrl from './normalize-url';
import { CREATE_TYPE, NO_RESULTS_TYPE } from './constants';
import { store as blockEditorStore } from '../../store';

export const handleNoop = () => Promise.resolve( [] );

export const handleDirectEntry = ( val ) => {
	const { url, type } = normalizeUrl( val );

	return Promise.resolve( [
		{
			id: val,
			title: val,
			url,
			type,
		},
	] );
};

const handleEntitySearch = async (
	val,
	suggestionsQuery,
	fetchSearchSuggestions,
	withCreateSuggestion,
	pageOnFront,
	pageForPosts
) => {
	const { isInitialSuggestions } = suggestionsQuery;

	const results = await fetchSearchSuggestions( val, suggestionsQuery );

	// Identify front page and update type to match. Posts, terms and media can
	// share an id, so only pages are considered.
	results.map( ( result ) => {
		if ( result.type !== 'page' ) {
			return result;
		}

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

	// URLInput only renders the suggestions dropdown when its list is non-empty.
	// Add a sentinel for empty searches so LinkControl can render a disabled
	// "No results found" option even when there is no create action.
	// When creation is available, also add a faux CREATE suggestion. This is
	// handled specially by the results renderer and lets URLInput provide its
	// normal keyboard and ARIA behavior for the action.
	//
	// Note also that the value of the `title` and `url` properties must correspond
	// to the text value of the `<input>`. This is because `title` is used
	// when creating the suggestion. Similarly `url` is used when using keyboard to select
	// the suggestion (the <form> `onSubmit` handler falls-back to `url`).
	const noResultsSuggestion =
		! results.length && ! withCreateSuggestion
			? [ { type: NO_RESULTS_TYPE } ]
			: [];

	return isURLLike( val ) || ! withCreateSuggestion
		? results.concat( noResultsSuggestion )
		: results
				.concat( {
					// the `id` prop is intentionally omitted here because it
					// is never exposed as part of the component's public API.
					// see: https://github.com/WordPress/gutenberg/pull/19775#discussion_r378931316.
					title: val, // Must match the existing `<input>`s text value.
					url: val, // Must match the existing `<input>`s text value.
					type: CREATE_TYPE,
				} )
				.concat( noResultsSuggestion );
};

export default function useSearchHandler(
	suggestionsQuery,
	allowDirectEntry,
	withCreateSuggestion
) {
	const { fetchSearchSuggestions, pageOnFront, pageForPosts } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );

			return {
				pageOnFront: getSettings().pageOnFront,
				pageForPosts: getSettings().pageForPosts,
				fetchSearchSuggestions:
					getSettings().__experimentalFetchLinkSuggestions,
			};
		},
		[]
	);

	const directEntryHandler = allowDirectEntry
		? handleDirectEntry
		: handleNoop;

	return useCallback(
		( val, { isInitialSuggestions } ) => {
			return isURLLike( val )
				? directEntryHandler( val, { isInitialSuggestions } )
				: handleEntitySearch(
						val,
						{ ...suggestionsQuery, isInitialSuggestions },
						fetchSearchSuggestions,
						withCreateSuggestion,
						pageOnFront,
						pageForPosts
					);
		},
		[
			directEntryHandler,
			fetchSearchSuggestions,
			pageOnFront,
			pageForPosts,
			suggestionsQuery,
			withCreateSuggestion,
		]
	);
}
