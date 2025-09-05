/**
 * WordPress dependencies
 */
import { getProtocol, prependHTTP } from '@wordpress/url';
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import isURLLike from './is-url-like';
import {
	CREATE_TYPE,
	TEL_TYPE,
	MAILTO_TYPE,
	INTERNAL_TYPE,
	URL_TYPE,
} from './constants';
import { store as blockEditorStore } from '../../store';

export const handleNoop = () => Promise.resolve( [] );

export const handleDirectEntry = ( val ) => {
	let type = URL_TYPE;

	const protocol = getProtocol( val ) || '';

	if ( protocol.includes( 'mailto' ) ) {
		type = MAILTO_TYPE;
	}

	if ( protocol.includes( 'tel' ) ) {
		type = TEL_TYPE;
	}

	if ( val?.startsWith( '#' ) ) {
		type = INTERNAL_TYPE;
	}

	return Promise.resolve( [
		{
			id: val,
			title: val,
			url: type === 'URL' ? prependHTTP( val ) : val,
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
	return isURLLike( val ) || ! withCreateSuggestion
		? results
		: results.concat( {
				// the `id` prop is intentionally omitted here because it
				// is never exposed as part of the component's public API.
				// see: https://github.com/WordPress/gutenberg/pull/19775#discussion_r378931316.
				title: val, // Must match the existing `<input>`s text value.
				url: val, // Must match the existing `<input>`s text value.
				type: CREATE_TYPE,
		  } );
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
