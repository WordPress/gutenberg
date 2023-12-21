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
import { TEL_TYPE, MAILTO_TYPE, INTERNAL_TYPE, URL_TYPE } from './constants';
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
		( val, { isInitialSuggestions } ) => {
			return isURLLike( val )
				? directEntryHandler( val, { isInitialSuggestions } )
				: handleEntitySearch(
						val,
						{ ...suggestionsQuery, isInitialSuggestions },
						withCreateSuggestion
				  );
		},
		[
			directEntryHandler,
			handleEntitySearch,
			suggestionsQuery,
			withCreateSuggestion,
		]
	);
}
