
/**
 * External dependencies
 */
import { startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	isURL,
	prependHTTP,
	getProtocol,
} from '@wordpress/url';

/**
 * Internal dependencies
 */
import BaseURLInput from '../base-url-input';
import useSuggestions from '../use-suggestions';
import InlineSuggestionListContainer from './container';
import InlineSuggestionListItem from './item';

function getURLType( url ) {
	const protocol = getProtocol( url ) || '';

	if ( protocol.includes( 'mailto' ) ) {
		return 'mailto';
	}

	if ( protocol.includes( 'tel' ) ) {
		return 'tel';
	}

	if ( startsWith( url, '#' ) ) {
		return 'internal';
	}

	return 'url';
}

const getURLSearchSuggestion = ( value ) => {
	const type = getURLType( value );
	return {
		id: '-1',
		title: value,
		url: type === 'URL' ? prependHTTP( value ) : value,
		type,
	};
};

function isURLSearchTerm( searchTerm ) {
	const protocol = getProtocol( searchTerm ) || '';
	const isMailto = protocol.includes( 'mailto' );
	const isInternal = startsWith( searchTerm, '#' );
	const isTel = protocol.includes( 'tel' );

	return isInternal || isMailto || isTel || isURL( searchTerm ) || ( searchTerm && searchTerm.includes( 'www.' ) );
}

function enhanceFetchSuggestions( fetchSuggestions ) {
	return async ( searchTerm ) => isURLSearchTerm( searchTerm ) ?
		[ getURLSearchSuggestion( searchTerm ) ] :
		fetchSuggestions( searchTerm );
}

function filterSuggestionResults( suggestionResults, searchTerm ) {
	const couldBeURL = !! searchTerm && ! searchTerm.includes( ' ' );

	// If it's ambiguous as to whether the search term is a URL,
	// include a URL search suggestion just in case.
	if ( couldBeURL ) {
		return [ ...suggestionResults, getURLSearchSuggestion( searchTerm ) ];
	}

	return suggestionResults;
}

export default function URLInputWithInlineSuggestions( props ) {
	const { value = '', onChange, disableSuggestions } = props;
	const [ selectedSuggestionIndex, setSelectedSuggestionIndex ] = useState();
	const fetchSuggestions = useSelect( ( select ) => {
		const { __experimentalFetchLinkSuggestions } = select( 'core/block-editor' ).getSettings();
		return __experimentalFetchLinkSuggestions;
	} );
	const enhancedFetchSuggestions = useCallback( enhanceFetchSuggestions( fetchSuggestions ), [ fetchSuggestions ] );
	const { suggestions, isFetchingSuggestions } = useSuggestions( value, enhancedFetchSuggestions, disableSuggestions );
	const filteredSuggestions = filterSuggestionResults( suggestions, value );

	return (
		<BaseURLInput
			suggestionListContainer={ InlineSuggestionListContainer }
			suggestionListItem={ InlineSuggestionListItem }
			onChangeSelectedSuggestion={ ( index ) => setSelectedSuggestionIndex( index ) }
			selectedSuggestionIndex={ selectedSuggestionIndex }
			suggestions={ filteredSuggestions }
			isFetchingSuggestions={ isFetchingSuggestions }
			onKeyDown={ ( event ) => {
				// For inline suggestions, add behaviour that uses the last suggestion when enter is pressed
				// and no suggestion is selected.
				if ( event.keyCode === ENTER && suggestions && selectedSuggestionIndex === undefined ) {
					const suggestion = suggestions[ suggestions.length - 1 ];
					onChange( suggestion.url, suggestion );
				}
			} }
			{ ...props }
		/>
	);
}
