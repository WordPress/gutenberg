
/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export default function useSuggestionListScrolling( showSuggestions, selectedSuggestionItemRef, suggestionListRef ) {
	let timeoutId;
	useEffect( () => {
		if ( showSuggestions && selectedSuggestionItemRef && ! timeoutId !== undefined ) {
			scrollIntoView( selectedSuggestionItemRef, suggestionListRef, {
				onlyScrollIfNeeded: true,
			} );

			clearTimeout( timeoutId );
			timeoutId = setTimeout( () => timeoutId = undefined, 100 );
		}

		return () => {
			clearTimeout( timeoutId );
			timeoutId = undefined;
		};
	}, [ showSuggestions, selectedSuggestionItemRef, timeoutId ] );
}
