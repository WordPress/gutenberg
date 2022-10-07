/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import type { ReactElement } from 'react';

export interface NoticeProps {
	/**
	 * class names.
	 */
	className?: string;

	/**
	 * can be `warning` (yellow), `success` (green), `error` (red), or `info`. Defaults to `info`.
	 *
	 * @default 'info'
	 */
	status?: 'warning' | 'success' | 'error' | 'info';

	/**
	 * The displayed message of a notice. Also used as the spoken message for assistive technology,
	 * unless `spokenMessage` is provided as an alternative message.
	 */
	children: string | ReactElement;

	/**
	 * Used to provide a custom spoken message in place of the `children` default.
	 */
	spokenMessage?: string | ReactElement;

	/**
	 * Function called when dismissing the notice
	 */
	onRemove?: () => void;

	/**
	 * Callback function which is executed when the notice is dismissed. It is distinct from onRemove, which _looks_ like a callback but is actually the function to call to remove the notice from the UI.
	 */
	onDismiss?: () => void;

	/**
	 * A politeness level for the notice's spoken message. Should be provided as one of the valid options for [an `aria-live` attribute value](https://www.w3.org/TR/wai-aria-1.1/#aria-live). If not provided, a sensible default is used based on the notice status. Note that this value should be considered a suggestion; assistive technologies may override it based on internal heuristics.
	 *   - A value of `'assertive'` is to be used for important, and usually time-sensitive, information. It will interrupt anything else the screen reader is announcing in that moment.
	 *   - A value of `'polite'` is to be used for advisory information. It should not interrupt what the screen reader is announcing in that moment (the "speech queue") or interrupt the current task.
	 */
	politeness?: 'polite' | 'assertive';

	/**
	 * Defaults to true, whether the notice should be dismissible or not
	 */
	isDismissible?: boolean;

	/**
	 * An array of action objects. Each member object should contain a `label` and either a `url` link string or `onClick` callback function. A `className` property can be used to add custom classes to the button styles. The default appearance of the button is inferred based on whether `url` or `onClick` are provided, rendering the button as a link if appropriate. A `noDefaultClasses` property value of `true` will remove all default styling. You can denote a primary button action for a notice by passing the `variant` property with a value of `primary`.
	 */
	actions?: {
		className?: string;
		label: string;
		isPrimary?: boolean;
		variant?: 'primary';
		noDefaultClasses?: boolean;
		onClick?: () => void;
		url?: string;
	}[];

	__unstableHTML?: boolean;
}
