/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo, useEffect } from '@wordpress/element';

const DEBOUNCE_IN_MS = 500;

export default function useDebouncedSearch() {
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const [ debouncing, setDebouncing ] = useState( false );

	useEffect( () => {
		setDebouncing( false );
	}, [ search ] );

	const debouncedSetSearch = useCallback(
		debounce( setSearch, DEBOUNCE_IN_MS ),
		[ setSearch ]
	);

	const handleOnSearch = useCallback(
		( value ) => {
			setSearchInput( value );
			debouncedSetSearch( value );
			setDebouncing( true );
		},
		[ setSearchInput, debouncedSetSearch ]
	);

	const menuProps = useMemo(
		() => ( {
			hasSearch: true,
			onSearch: handleOnSearch,
			search: searchInput,
		} ),
		[ handleOnSearch, searchInput ]
	);

	return { search, debouncing, menuProps };
}
