/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { SearchControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useDebouncedInput from '../../utils/use-debounced-input';

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
		onChangeViewRef.current( ( currentView ) => ( {
			...currentView,
			page: 1,
			search: debouncedSearch,
		} ) );
	}, [ debouncedSearch ] );
	const searchLabel = label || __( 'Filter list' );
	return (
		<SearchControl
			onChange={ setSearch }
			value={ search }
			label={ searchLabel }
			placeholder={ searchLabel }
			size="compact"
		/>
	);
}
