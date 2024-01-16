/**
 * WordPress dependencies
 */
import { store as interfaceStore } from '@wordpress/interface';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { PreferencesModal } = unlock( editorPrivateApis );

export const PREFERENCES_MODAL_NAME = 'edit-site/preferences';

export default function EditSitePreferencesModal() {
	const isModalActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( PREFERENCES_MODAL_NAME )
	);
	const { closeModal } = useDispatch( interfaceStore );

	if ( ! isModalActive ) {
		return null;
	}
	return (
		<PreferencesModal isActive={ isModalActive } onClose={ closeModal } />
	);
}
