import { SearchControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';

/**
 * The Media tab's search field.
 *
 * `DataViews.Search` would do this, but it hardcodes the compact size and the
 * tab matches the search control the other inserter tabs use. The debounce it
 * would have provided is reproduced here, so the caller only sees settled
 * values and refetches once the reader stops typing.
 */
export default function MediaSearch( {
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: ( value: string ) => void;
} ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput( value );

	// Follow the value back when it changes from elsewhere (e.g. switching
	// source resets it), without clobbering what is being typed.
	useEffect( () => {
		if ( value !== debouncedSearch ) {
			setSearch( value );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `debouncedSearch` would re-sync mid-type.
	}, [ value, setSearch ] );

	// Held in refs so the effect below depends on the debounced value alone.
	const onChangeRef = useRef( onChange );
	const valueRef = useRef( value );
	useEffect( () => {
		onChangeRef.current = onChange;
		valueRef.current = value;
	}, [ onChange, value ] );
	useEffect( () => {
		if ( debouncedSearch !== valueRef.current ) {
			onChangeRef.current( debouncedSearch );
		}
	}, [ debouncedSearch ] );

	return (
		<SearchControl
			className="block-editor-inserter__media-grid__search-control"
			label={ label }
			placeholder={ label }
			value={ search }
			onChange={ setSearch }
		/>
	);
}
