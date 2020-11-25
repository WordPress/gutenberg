/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../../store';

export default function SaveButton( { navigationPost } ) {
	const { saveNavigationPost } = useDispatch( editNavigationStore );

	return (
		<Button
			className="edit-navigation-toolbar__save-button"
			isPrimary
			onClick={ () => {
				saveNavigationPost( navigationPost );
			} }
		>
			{ __( 'Save' ) }
		</Button>
	);
}
