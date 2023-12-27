/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { SearchControl } from '@wordpress/components';
import { useDebouncedInput } from '@wordpress/compose';

export default function Search( { label, view, onChangeView } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput(
		view.search
	);
	useEffect( () => {
		setSearch( view.search );
	}, [ view ] );
	const onChangeViewRef = useRef( onChangeView );
	useEffect( () => {
		onChangeViewRef.current = onChangeView;
	}, [ onChangeView ] );
	useEffect( () => {
		onChangeViewRef.current( {
			...view,
			page: 1,
			search: debouncedSearch,
		} );
	}, [ debouncedSearch ] );
	const searchLabel = label || __( 'Filter list' );
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
}
