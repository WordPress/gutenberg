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

export default function TextFilter( { filter, view, onChangeView } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput(
		view.filters[ filter.id ]
	);
	useEffect( () => {
		setSearch( view.filters[ filter.id ] );
	}, [ view ] );
	const onChangeViewRef = useRef( onChangeView );
	useEffect( () => {
		onChangeViewRef.current = onChangeView;
	}, [ onChangeView ] );
	useEffect( () => {
		onChangeViewRef.current( ( currentView ) => ( {
			...currentView,
			page: 1,
			filters: {
				...currentView.filters,
				[ filter.id ]: debouncedSearch,
			},
		} ) );
	}, [ debouncedSearch ] );
	const searchLabel = filter?.name || __( 'Filter list' );
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
