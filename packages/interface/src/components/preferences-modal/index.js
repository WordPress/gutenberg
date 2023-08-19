/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function PreferencesModal( { closeModal, children } ) {
	return (
		<Modal
			className="interface-preferences-modal interface-complementary-area"
			title={ __( 'Preferences' ) }
			onRequestClose={ closeModal }
		>
			{ children }
		</Modal>
	);
}
