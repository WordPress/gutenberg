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

type BaseProps = {
	children: ReactNode;
	onConfirm: ( event: DialogInputEvent ) => void;
	confirmButtonText?: string;
	cancelButtonText?: string;
};

type ControlledProps = BaseProps & {
	onCancel: ( event: DialogInputEvent ) => void;
	isOpen: boolean;
};

type UncontrolledProps = BaseProps & {
	onCancel?: ( event: DialogInputEvent ) => void;
	isOpen?: never;
};

export type OwnProps = ControlledProps | UncontrolledProps;
