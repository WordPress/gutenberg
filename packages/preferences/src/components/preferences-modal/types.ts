/**
 * WordPress dependencies
 */
import type { Modal } from '@wordpress/components';

type ModalProps = Parameters< typeof Modal >[ 0 ];

export type PreferencesModalProps = {
	closeModal: ModalProps[ 'onRequestClose' ];
	children: React.ReactNode;
};
