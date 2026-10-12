import { SearchControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';

/**
 * The Media tab's search field.
 *
 * `DataViews.Search` would do this, but it hardcodes the compact size and the
 * tab matches the search control the other inserter tabs use. The debounce it
 * would have provided is reproduced here, so the caller only sees settled
 * values and refetches once the reader stops typing.
 *
 * The field owns what is typed and reports it once it settles, so the caller
 * cannot drive it: `defaultValue` seeds it and nothing more.
 */
export default function MediaSearch( {
	label,
	defaultValue,
	onChange,
}: {
	label: string;
	defaultValue: string;
	onChange: ( value: string ) => void;
} ) {
	const [ search, setSearch, debouncedSearch ] =
		useDebouncedInput( defaultValue );

	useEffect( () => {
		onChange( debouncedSearch );
	}, [ debouncedSearch, onChange ] );

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
