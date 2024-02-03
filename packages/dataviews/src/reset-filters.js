/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ResetFilter( { filters, view, onChangeView } ) {
	const isPrimary = ( field ) =>
		filters.some( ( f ) => f.field === field && f.isPrimary );
	let isDisabled = true;
	if ( view.search !== '' ) {
		isDisabled = false;
	} else if (
		view.filters?.length > 0 &&
		( view.filters.some( ( filter ) => filter.value !== undefined ) ||
			view.filters.some(
				( filter ) =>
					filter.value === undefined && ! isPrimary( filter.field )
			) )
	) {
		isDisabled = false;
	}

	return (
		<Button
			disabled={ isDisabled }
			__experimentalIsFocusable
			size="compact"
			variant="tertiary"
			onClick={ () => {
				onChangeView( {
					...view,
					page: 1,
					search: '',
					filters: [],
				} );
			} }
		>
			{ __( 'Reset filters' ) }
		</Button>
	);
}
