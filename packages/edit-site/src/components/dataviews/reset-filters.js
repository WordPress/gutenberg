/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default ( { view, onChangeView } ) => {
	return (
		<BaseControl>
			<Button
				disabled={ view.search === '' && view.filters?.length === 0 }
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
