/**
 * External dependencies
 */
import type { ReactNode, SyntheticEvent } from 'react';

type CommonNoticeActionProps = {
	label: string;
	className?: string;
	noDefaultClasses?: boolean;
	variant?: 'primary';
};
// `url` and `onClick` can both be provided, but `url` takes precedence. If
// `url` is provided, the action's button will be rendered as an anchor and
// `onClick` will be ignored.
type NoticeActionWithURL = CommonNoticeActionProps & {
	url: string;
	onClick?: () => void;
};
type NoticeActionWithOnClick = CommonNoticeActionProps & {
	url?: string;
	onClick: ( event: SyntheticEvent ) => void;
};

export type NoticeAction = NoticeActionWithURL | NoticeActionWithOnClick;

type NoticeChildren = string | JSX.Element;

export type NoticeProps = {
	/**
	 * The displayed message of a notice. Also used as the spoken message for
	 * assistive technology, unless `spokenMessage` is provided as an alternative message.
	 */
	children: ReactNode;
	/**
	 * Used to provide a custom spoken message in place of the `children` default.
	 *
	 * @default `children`
	 */
	spokenMessage?: ReactNode;
	/**
	 * Can be warning (yellow), success (green), error (red), or info.
	 *
	 * @default 'info'
	 */
	status?: 'warning' | 'success' | 'error' | 'info';
	/**
	 * Function called when dismissing the notice
	 *
	 * @default noop
	 */
	onRemove?: () => void;
	/**
	 * A politeness level for the notice's spoken message. Should be provided as
	 * one of the valid options for an aria-live attribute value. If not provided,
	 * a sensible default is used based on the notice status. Note that this
	 * value should be considered a suggestion; assistive technologies may
	 * override it based on internal heuristics.
	 */
	politeness?: 'polite' | 'assertive';
	/**
	 * Whether the notice should be dismissible or not
	 *
	 * @default true
	 */
	isDismissible?: boolean;
	/**
	 * Callback function which is executed when the notice is dismissed.
	 * It is distinct from onRemove, which looks like a callback but is actually
	 * the function to call to remove the notice from the UI.
	 *
	 * @default noop
	 */
	onDismiss?: () => void;
	/**
	 * An array of action objects.
	 *
	 * @default []
	 */
	actions?: Array< NoticeAction >;
	/**
	 * Determines whether or not the message should be parsed as custom HTML
	 * instead of a string.
	 */
	__unstableHTML?: boolean;
};
