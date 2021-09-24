/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MouseEvent, KeyboardEvent } from 'react';

export type DialogInputEvent =
	| KeyboardEvent< HTMLDivElement >
	| MouseEvent< HTMLButtonElement >;

interface Props {
	isOpen: undefined;
	message: string;
	onConfirm: ( event: DialogInputEvent ) => void;
	onCancel?: ( event: DialogInputEvent ) => void;
}

export type OwnProps =
	| Props
	| {
			isOpen: boolean;
			message: string;
			onConfirm: ( event: DialogInputEvent ) => void;
			onCancel: ( event: DialogInputEvent ) => void;
	  };
