/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';

const DEBOUNCE_IN_MS = 500;

export function useDebouncedSearch() {
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ search, setSearch ] = useState( '' );

	const debouncedSetSearch = useCallback(
		debounce( setSearch, DEBOUNCE_IN_MS ),
		[ setSearch ]
	);

	const handleOnSearch = useCallback(
		( value ) => {
			setSearchInput( value );
			debouncedSetSearch( value );
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

	return { search, menuProps };
}
