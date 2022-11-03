/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode, SyntheticEvent } from 'react';

export type NoticeActionWithURL = {
	label: string;
	url: string;
	onClick?: ( event: SyntheticEvent ) => void;
};

type NoticeActionWithOnClick = {
	label: string;
	url?: string;
	onClick: ( event: SyntheticEvent ) => void;
};

// TODO: move this type to the Notice component once it gets typed.
export type NoticeAction = NoticeActionWithURL | NoticeActionWithOnClick;

export type Notice = {
	id: string;
	spokenMessage: string;
	actions: NoticeAction[];
	icon?: ReactNode;
	onDismiss?: () => void;
	content: string;
	isDismissible: boolean;
	explicitDismiss: boolean;
};

export type SnackbarProps = {
	/**
	 * The displayed message of a notice.
	 *
	 * Also used as the spoken message for assistive technology,
	 * unless `spokenMessage` is provided as an alternative message.
	 */
	children: string;
	/**
	 * Used to provide a custom spoken message.
	 *
	 * @default children
	 */
	spokenMessage?: Notice[ 'spokenMessage' ];
	/**
	 * A politeness level for the notice's spoken message. Should be provided as
	 * one of the valid options for an `aria-live` attribute value. Note that this
	 * value should be considered a suggestion; assistive technologies may
	 * override it based on internal heuristics.
	 *
	 * A value of `'assertive'` is to be used for important, and usually
	 * time-sensitive, information. It will interrupt anything else the screen
	 * reader is announcing in that moment.
	 * A value of `'polite'` is to be used for advisory information. It should
	 * not interrupt what the screen reader is announcing in that moment
	 * (the "speech queue") or interrupt the current task.
	 *
	 * @see https://www.w3.org/TR/wai-aria-1.1/#aria-live
	 *
	 * @default 'polite'
	 */
	politeness?: 'polite' | 'assertive';
	/**
	 * An array of action objects.
	 *
	 * Each member object should contain
	 * a `label` and either a `url` link string or `onClick` callback function.
	 *
	 * @default []
	 */
	actions?: Notice[ 'actions' ];
	/**
	 * Called to remove the snackbar from the UI.
	 */
	onRemove?: () => void;
	/**
	 * The icon to render in the snackbar.
	 *
	 * @default null
	 */
	icon?: Notice[ 'icon' ];
	/**
	 * Whether to require user action to dismiss the snackbar.
	 * By default, this is dismissed on a timeout, without user interaction.
	 *
	 * @default false
	 */
	explicitDismiss?: Notice[ 'explicitDismiss' ];
	/**
	 * A callback executed when the snackbar is dismissed.
	 *
	 * It is distinct from onRemove, which _looks_ like a callback but is
	 * actually the function to call to remove the snackbar from the UI.
	 */
	onDismiss?: Notice[ 'onDismiss' ];
	/**
	 * A ref to the list that contains the snackbar.
	 */
	listRef?: MutableRefObject< HTMLDivElement | null >;
};

export type SnackbarListProps = {
	/**
	 * Array of notices to render.
	 */
	notices: Notice[];
	/**
	 * Children to be rendered inside the notice list.
	 */
	children?: ReactNode;
	/**
	 * Function called when a notice should be removed / dismissed.
	 */
	onRemove?: ( id: Notice[ 'id' ] ) => void;
};
