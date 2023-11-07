/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default ( { onChangeView } ) => {
	return (
		<Button
			variant="tertiary"
			onClick={ () => {
				onChangeView( ( currentView ) => ( {
					...currentView,
					page: 1,
					filters: [],
				} ) );
			} }
		>
			{ __( 'Reset filters' ) }
		</Button>
	);
};
