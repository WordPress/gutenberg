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

export default function TextFilter( { id, view, onChangeView } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput(
		view.filters[ id ]
	);
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
				[ id ]: debouncedSearch,
			},
		} ) );
	}, [ debouncedSearch ] );
	const searchLabel = __( 'Filter list' );
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
