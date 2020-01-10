/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import BaseURLInput from '../base-url-input';
import useSuggestions from '../use-suggestions';
import PopoverSuggestionListContainer from './container';
import PopoverSuggestionListItem from './item';

function enhanceFetchSuggestions( fetchSuggestions ) {
	return async ( searchTerm ) => isURL( searchTerm ) ? [] : fetchSuggestions( searchTerm );
}

export default function URLInputWithPopoverSuggestion( props ) {
	const { value = '', disableSuggestions } = props;
	const [ selectedSuggestionIndex, setSelectedSuggestionIndex ] = useState();
	const fetchSuggestions = useSelect( ( select ) => {
		const { __experimentalFetchLinkSuggestions } = select( 'core/block-editor' ).getSettings();
		return __experimentalFetchLinkSuggestions;
	} );
	const enhancedFetchSuggestions = useCallback( enhanceFetchSuggestions( fetchSuggestions ), [ fetchSuggestions ] );
	const suggestionProps = useSuggestions( value, enhancedFetchSuggestions, disableSuggestions );

	return (
		<BaseURLInput
			suggestionListContainer={ PopoverSuggestionListContainer }
			suggestionListItem={ PopoverSuggestionListItem }
			onChangeSelectedSuggestion={ ( index ) => setSelectedSuggestionIndex( index ) }
			selectedSuggestionIndex={ selectedSuggestionIndex }
			{ ...suggestionProps }
			{ ...props }
		/>
	);
}
