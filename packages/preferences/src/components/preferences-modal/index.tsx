/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type ModalProps = Parameters< typeof Modal >[ 0 ];

export type PreferencesModalProps = {
	closeModal: ModalProps[ 'onRequestClose' ];
	children: ReactNode;
};
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
