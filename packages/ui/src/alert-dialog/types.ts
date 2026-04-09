import type { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import type { ReactNode } from 'react';

import type { ComponentProps } from '../utils/types';

/**
 * The return type of `onConfirm`. Return `void` (or nothing) to auto-close
 * the dialog after the confirm handler completes. Return `{ close: false }`
 * to keep the dialog open (e.g. for validation errors).
 *
 * Return `{ error: '...' }` to display a built-in error message below the
 * action buttons. When `error` is provided, the dialog stays open
 * regardless of the `close` value.
 */
export type ConfirmResult = void | { close?: boolean; error?: string };

export interface RootProps
	extends Pick<
		_AlertDialog.Root.Props,
		'open' | 'onOpenChange' | 'defaultOpen'
	> {
	/**
	 * The content to be rendered inside the component. Typically includes
	 * `AlertDialog.Trigger` and `AlertDialog.Popup`.
	 */
	children: ReactNode;

	/**
	 * Callback fired when the user confirms the action.
	 *
	 * - Synchronous handlers: the dialog closes immediately after the
	 *   handler returns.
	 * - Async handlers: the dialog enters a "pending" state (buttons
	 *   disabled, spinner shown on the confirm button) until the promise
	 *   settles.
	 *
	 * Return `{ close: false }` to keep the dialog open after the handler
	 * completes (e.g. for server-side validation). Return `void` or
	 * `{ close: true }` to close the dialog (the default).
	 *
	 * Return `{ error: '...' }` to show a built-in error message below
	 * the action buttons. The dialog stays open regardless of the `close`
	 * value. The error is announced to screen readers and is automatically
	 * cleared on the next confirm attempt or when the dialog reopens.
	 *
	 * If the promise rejects (or the handler throws) without returning an
	 * `error`, the dialog stays open and returns to idle without showing
	 * a visible error message. The error is logged to the console.
	 * To show a user-facing message on failure, catch the error and
	 * return `{ close: false, error: '...' }`.
	 */
	onConfirm?: () => ConfirmResult | Promise< ConfirmResult >;
}

export interface TriggerProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface PopupProps
	extends ComponentProps< 'div' >,
		Pick< _AlertDialog.Popup.Props, 'initialFocus' | 'finalFocus' > {
	/**
	 * The semantic intent of the dialog, which determines its styling.
	 *
	 * All intents use `role="alertdialog"`, are always modal, and block
	 * backdrop click dismissal. Escape key and the cancel/confirm buttons
	 * still dismiss the dialog.
	 *
	 * - `'default'`: Standard confirmation dialog for reversible actions.
	 * - `'irreversible'`: Confirmation dialog for irreversible actions that
	 *   cannot be undone. The confirm button uses error/danger coloring.
	 *
	 * @default 'default'
	 */
	intent?: 'default' | 'irreversible';

	/**
	 * The title displayed in the dialog header. This serves as both the
	 * visible heading and the accessible label (`aria-labelledby`) for the
	 * dialog. Must be a plain string to ensure a predictable accessible name.
	 */
	title: string;

	/**
	 * An optional description displayed below the title. Rendered using
	 * Base UI's `AlertDialog.Description` for proper `aria-describedby`
	 * association with the dialog. Must be a plain string to ensure a
	 * predictable accessible description.
	 */
	description?: string;

	/**
	 * Optional body content displayed between the description and the
	 * action buttons. Use for supplementary details or form fields.
	 */
	children?: ReactNode;

	/**
	 * Custom text for the confirm button.
	 *
	 * @default 'OK'
	 */
	confirmButtonText?: string;

	/**
	 * Custom text for the cancel button.
	 *
	 * @default 'Cancel'
	 */
	cancelButtonText?: string;
}
