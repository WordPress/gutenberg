/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

/**
 * Internal dependencies
 */
import { PREFERENCES_MODAL_NAME } from '../../../components/preferences-modal';

export default function PreferencesMenuItem() {
	const { openModal } = useDispatch( interfaceStore );
	return (
		<MenuItem
			onClick={ () => {
				openModal( PREFERENCES_MODAL_NAME );
			} }
		>
			{ __( 'Preferences' ) }
		</MenuItem>
	);
}
