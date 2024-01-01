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
import { default as settingsKeys } from '../../private-settings-keys';

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

export default function useSearchHandler(
	suggestionsQuery,
	allowDirectEntry,
	withCreateSuggestion
) {
	const handleNoop = useCallback( () => Promise.resolve( [] ), [] );
	const directEntryHandler = allowDirectEntry
		? handleDirectEntry
		: handleNoop;

	const useHandleEntitySearch = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings[ settingsKeys.useLinkControlEntitySearch ];
	}, [] );
	// Note that this is meant to be a stable function and doesn't change, so it
	// doesn't break the rules of hooks.
	const handleEntitySearch = useHandleEntitySearch?.() || handleNoop;

	return useCallback(
		async ( val, { isInitialSuggestions } ) => {
			if ( isURLLike( val ) ) {
				return directEntryHandler( val, { isInitialSuggestions } );
			}

			const results = await handleEntitySearch( val, suggestionsQuery );

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
						type: CREATE_TYPE,
				  } );
		},
		[
			directEntryHandler,
			handleEntitySearch,
			suggestionsQuery,
			withCreateSuggestion,
		]
	);
}
