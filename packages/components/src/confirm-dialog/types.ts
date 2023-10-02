/**
 * External dependencies
 */
import type { MouseEvent, KeyboardEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ModalProps } from '../modal/types';

export type DialogInputEvent =
	| Parameters< ModalProps[ 'onRequestClose' ] >[ 0 ]
	| KeyboardEvent< HTMLDivElement >
	| MouseEvent< HTMLButtonElement >;

export type ConfirmDialogProps = {
	children: ReactNode;
	onConfirm: ( event: DialogInputEvent ) => void;
	confirmButtonText?: string;
	cancelButtonText?: string;
	onCancel?: ( event: DialogInputEvent ) => void;
	isOpen?: boolean;
};
