/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SEARCH_DEBOUNCE_IN_MS } from './constants';

export default function useDebouncedSearch() {
	// The value used by the NavigationMenu to control the input field.
	const [ search, setSearch ] = useState( '' );
	// The value used to actually perform the search query.
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ isDebouncing, setIsDebouncing ] = useState( false );

	useEffect( () => {
		setIsDebouncing( false );
	}, [ searchQuery ] );

	const debouncedSetSearchQuery = useCallback(
		debounce( setSearchQuery, SEARCH_DEBOUNCE_IN_MS ),
		[ setSearchQuery ]
	);

	const onSearch = useCallback(
		( value ) => {
			setSearch( value );
			debouncedSetSearchQuery( value );
			setIsDebouncing( true );
		},
		[ setSearch, setIsDebouncing, debouncedSetSearchQuery ]
	);

	return {
		search,
		searchQuery,
		isDebouncing,
		onSearch,
	};
}
