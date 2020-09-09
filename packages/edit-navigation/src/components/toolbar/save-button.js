/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SaveButton( { menuId } ) {
	const post = useSelect( ( select ) =>
		select( 'core/edit-navigation' ).getNavigationPostForMenu( menuId )
	);

	const { saveNavigationPost } = useDispatch( 'core/edit-navigation' );

	return (
		<Button
			className="edit-navigation-toolbar__save-button"
			isPrimary
			onClick={ () => {
				saveNavigationPost( post );
			} }
		>
			{ __( 'Save' ) }
		</Button>
	);
}
