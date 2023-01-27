/**
 * External dependencies
 */
import type { MouseEventHandler, ReactNode } from 'react';

type CommonNoticeActionProps = {
	label: string;
	className?: string;
	noDefaultClasses?: boolean;
	variant?: 'primary' | 'secondary' | 'link';
};
// `url` and `onClick` can both be provided, but `url` takes precedence. If
// `url` is provided, the action's button will be rendered as an anchor and
// `onClick` will be ignored.
type NoticeActionWithURL = CommonNoticeActionProps & {
	url: string;
	onClick?: never;
};
type NoticeActionWithOnClick = CommonNoticeActionProps & {
	url?: never;
	onClick: MouseEventHandler< HTMLButtonElement >;
};

export type NoticeAction = NoticeActionWithURL | NoticeActionWithOnClick;

export type NoticeChildren = string | JSX.Element;

export type NoticeProps = {
	/**
	 * A CSS `class` to give to the wrapper element.
	 */
	className?: string;
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
	 * Determines the color of the notice: `warning` (yellow),
	 * `success` (green), `error` (red), or `'info'`.
	 * By default `'info'` will be blue, but if there is a parent Theme component
	 * with an accent color prop, the notice will take on that color instead.
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
	 * one of the valid options for an `aria-live` attribute value.
	 *
	 * A value of `'assertive'` is to be used for important, and usually
	 * time-sensitive, information. It will interrupt anything else the screen
	 * reader is announcing in that moment.
	 * A value of `'polite'` is to be used for advisory information. It should
	 * not interrupt what the screen reader is announcing in that moment
	 * (the "speech queue") or interrupt the current task.
	 *
	 * Note that this value should be considered a suggestion; assistive
	 * technologies may override it based on internal heuristics.
	 *
	 * @see https://www.w3.org/TR/wai-aria-1.1/#aria-live
	 *
	 * @default 'assertive' for 'error' status, 'polite' for all other statuses
	 */
	politeness?: 'polite' | 'assertive';
	/**
	 * Whether the notice should be dismissible or not
	 *
	 * @default true
	 */
	isDismissible?: boolean;
	/**
	 * A deprecated alternative to `onRemove`. This prop is kept for
	 * compatibilty reasons but should be avoided.
	 *
	 * @default noop
	 */
	onDismiss?: () => void;
	/**
	 * An array of action objects. Each member object should contain:
	 *
	 * - `label`: `string` containing the text of the button/link
	 * - `url`: `string` OR `onClick`: `( event: SyntheticEvent ) => void` to specify
	 *    what the action does.
	 * - `className`: `string` (optional) to add custom classes to the button styles.
	 * - `noDefaultClasses`: `boolean` (optional) A value of `true` will remove all
	 *    default styling.
	 * - `variant`: `'primary' | 'secondary' | 'link'` (optional) You can denote a
	 *    primary button action for a notice by passing a value of `primary`.
	 *
	 * The default appearance of an action button is inferred based on whether
	 * `url` or `onClick` are provided, rendering the button as a link if
	 * appropriate. If both props are provided, `url` takes precedence, and the
	 * action button will render as an anchor tag.
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

export type NoticeListProps = {
	/**
	 * Array of notices to render.
	 */
	notices: Array<
		Omit< NoticeProps, 'children' > & {
			id: string;
			content: string;
		}
	>;
	/**
	 * Function called when a notice should be removed / dismissed.
	 */
	onRemove?: ( id: string ) => void;
	/**
	 * Children to be rendered inside the notice list.
	 */
	children?: ReactNode;
};
