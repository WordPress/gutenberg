import type { ReactNode } from 'react';

import type {
	RootProps as DialogRootProps,
	TriggerProps as DialogTriggerProps,
} from '../dialog/types';

export interface RootProps
	extends Pick< DialogRootProps, 'open' | 'onOpenChange' | 'defaultOpen' > {
	/**
	 * The content to be rendered inside the component. Typically includes
	 * `ConfirmDialog.Trigger` and `ConfirmDialog.Popup`.
	 */
	children: ReactNode;

	/**
	 * The semantic intent of the dialog, which determines its behavior and
	 * styling.
	 *
	 * - `'default'`: Standard confirmation dialog for reversible actions.
	 *   The dialog can be dismissed via Escape key, backdrop click, or the
	 *   cancel/confirm buttons. Uses `role="dialog"`.
	 * - `'irreversible'`: Confirmation dialog for irreversible actions that
	 *   cannot be undone. Users can only dismiss the dialog via the cancel or
	 *   confirm button — both backdrop click and Escape key are blocked.
	 *   Uses `role="alertdialog"` and error/danger coloring on the confirm
	 *   button.
	 *
	 * @default 'default'
	 */
	intent?: 'default' | 'irreversible';
}

export type TriggerProps = DialogTriggerProps;

export interface PopupProps {
	/**
	 * The title displayed in the dialog header. This serves as both the
	 * visible heading and the accessible label for the dialog.
	 */
	title: string;

	/**
	 * The message content displayed in the dialog body.
	 */
	children: ReactNode;

	/**
	 * Callback fired when the user confirms the action.
	 */
	onConfirm: () => void;

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

	/**
	 * Whether the confirm action is in a loading state (e.g. an async
	 * operation is in progress). When `true`, the confirm button shows a
	 * spinner and the cancel button is disabled.
	 *
	 * To implement an async confirm flow, use controlled mode
	 * (`open` / `onOpenChange`) and manage the loading state externally:
	 * prevent closing in `onOpenChange` while loading, and set
	 * `open={false}` once the operation completes.
	 *
	 * @default false
	 */
	loading?: boolean;
}
