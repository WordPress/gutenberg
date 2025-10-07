/**
 * WordPress dependencies
 */
import type { Modal } from '@wordpress/components';
/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type ModalProps = Parameters< typeof Modal >[ 0 ];

export type PreferencesModalProps = {
	closeModal: ModalProps[ 'onRequestClose' ];
	children: ReactNode;
};
