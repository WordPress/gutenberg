/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ResetFilter( { filters, view, onChangeView } ) {
	const isPrimary = ( field ) =>
		filters.some(
			( _filter ) => _filter.field === field && _filter.isPrimary
		);
	const isDisabled =
		! view.search &&
		! view.filters?.some(
			( _filter ) =>
				_filter.value !== undefined || ! isPrimary( _filter.field )
		);
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
