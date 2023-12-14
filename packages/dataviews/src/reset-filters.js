/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LAYOUT_LIST } from './constants';

export default ( { view, onChangeView } ) => {
	if ( view.type === LAYOUT_LIST ) {
		return null;
	}

	return (
		<Button
			disabled={ view.search === '' && view.filters?.length === 0 }
			__experimentalIsFocusable
			size="compact"
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
