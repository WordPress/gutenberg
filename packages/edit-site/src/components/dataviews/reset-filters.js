/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default ( { view, onChangeView } ) => {
	return (
		<Button
			aria-disabled={ view.search === '' && view.filters?.length === 0 }
			__next40pxDefaultSize={ true }
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
	);
};
