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
	/**
	 * The actual message for the dialog. It's passed as children and any valid `ReactNode` is accepted.
	 */
	children: ReactNode;
	/**
	 * The callback that's called when the user confirms.
	 * A confirmation can happen when the `OK` button is clicked or when `Enter` is pressed.
	 */
	onConfirm: ( event: DialogInputEvent ) => void;
	/**
	 * The optional custom text to display as the confirmation button's label.
	 */
	confirmButtonText?: string;
	/**
	 * The optional custom text to display as the cancellation button's label.
	 */
	cancelButtonText?: string;
	/**
	 * The callback that's called when the user cancels. A cancellation can happen
	 * when the `Cancel` button is clicked, when the `ESC` key is pressed, or when
	 * a click outside of the dialog focus is detected (i.e. in the overlay).
	 *
	 * It's not required if `isOpen` is not set (uncontrolled mode), as the component
	 * will take care of closing itself, but you can still pass a callback if something
	 * must be done upon cancelling (the component will still close itself in this case).
	 *
	 * If `isOpen` is set (controlled mode), then it's required, and you need to set
	 * the state that defines `isOpen` to `false` as part of this callback if you want the
	 * dialog to close when the user cancels.
	 */
	onCancel?: ( event: DialogInputEvent ) => void;
	/**
	 * Defines if the dialog is open (displayed) or closed (not rendered/displayed).
	 * It also implicitly toggles the controlled mode if set or the uncontrolled mode if it's not set.
	 */
	isOpen?: boolean;
};
