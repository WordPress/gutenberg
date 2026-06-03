/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { PreferencesModalProps } from './types';

export default function PreferencesModal( {
	closeModal,
	children,
}: PreferencesModalProps ) {
	return (
		<Modal
			className="preferences-modal"
			title={ __( 'Preferences' ) }
			onRequestClose={ closeModal }
		>
			{ children }
		</Modal>
	);
}
