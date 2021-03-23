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
import { useMenuEntity, MenuIdContext } from '../../hooks';
import { useContext } from '@wordpress/element';

export default function SaveButton( { navigationPost } ) {
	const menuId = useContext( MenuIdContext );
	const { saveMenuName } = useMenuEntity( menuId );
	const { saveNavigationPost } = useDispatch( editNavigationStore );

	return (
		<Button
			className="edit-navigation-toolbar__save-button"
			isPrimary
			onClick={ () => {
				saveNavigationPost( navigationPost );
				saveMenuName();
			} }
			disabled={ ! navigationPost }
		>
			{ __( 'Save' ) }
		</Button>
	);
}
