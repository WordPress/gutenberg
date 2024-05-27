/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, memo } from '@wordpress/element';
import { SearchControl } from '@wordpress/components';
import { useDebouncedInput } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { View } from './types';

interface SearchProps {
	label?: string;
	view: View;
	onChangeView: ( view: View ) => void;
}

const Search = memo( function Search( {
	label,
	view,
	onChangeView,
}: SearchProps ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput(
		view.search
	);
	useEffect( () => {
		setSearch( view.search ?? '' );
	}, [ view.search, setSearch ] );
	const onChangeViewRef = useRef( onChangeView );
	const viewRef = useRef( view );
	useEffect( () => {
		onChangeViewRef.current = onChangeView;
		viewRef.current = view;
	}, [ onChangeView, view ] );
	useEffect( () => {
		onChangeViewRef.current( {
			...viewRef.current,
			page: 1,
			search: debouncedSearch,
		} );
	}, [ debouncedSearch ] );
	const searchLabel = label || __( 'Search' );
	return (
		<SearchControl
			__nextHasNoMarginBottom
			onChange={ setSearch }
			value={ search }
			label={ searchLabel }
			placeholder={ searchLabel }
			size="compact"
		/>
	);
} );

export default Search;
