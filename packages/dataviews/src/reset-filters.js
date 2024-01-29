/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function hasActiveFilters( view ) {
	return (
		view.search !== '' ||
		view.filters?.some( ( { value } ) => value !== undefined )
	);
}

export default function ResetFilter( { view, onChangeView } ) {
	return (
		<Button
			disabled={ ! hasActiveFilters( view ) }
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
