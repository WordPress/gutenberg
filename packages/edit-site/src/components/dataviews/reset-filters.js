/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default ( { onChangeView } ) => {
	return (
		<BaseControl>
			<Button
				variant="tertiary"
				onClick={ () => {
					onChangeView( ( currentView ) => ( {
						...currentView,
						page: 1,
						search: '',
						filters: [],
					} ) );
				} }
			>
				{ __( 'Reset filters' ) }
			</Button>
		</BaseControl>
	);
};
