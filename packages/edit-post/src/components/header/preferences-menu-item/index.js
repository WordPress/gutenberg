/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default function PreferencesMenuItem() {
	const { openModal } = useDispatch( editPostStore );
	return (
		<MenuItem
			onClick={ () => {
				openModal( 'edit-post/preferences' );
			} }
		>
			{ __( 'Preferences' ) }
		</MenuItem>
	);
}
