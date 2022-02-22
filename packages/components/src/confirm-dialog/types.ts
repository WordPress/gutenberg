/**
 * External dependencies
 */
import type { MouseEvent, KeyboardEvent, ReactNode } from 'react';

export type DialogInputEvent =
	| KeyboardEvent< HTMLDivElement >
	| MouseEvent< HTMLButtonElement >;

type BaseProps = {
	children: ReactNode;
	onConfirm: ( event: DialogInputEvent ) => void;
	confirmButtonText: string;
	cancelButtonText: string;
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
