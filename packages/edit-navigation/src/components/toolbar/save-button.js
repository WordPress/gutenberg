/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SaveButton( { navigationPost } ) {
	const { saveNavigationPost } = useDispatch( 'core/edit-navigation' );

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
