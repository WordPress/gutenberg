/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type TruncateEllipsizeMode =
	| 'auto'
	| 'head'
	| 'tail'
	| 'middle'
	| 'none';

export type TruncateProps = {
	/**
	 * The ellipsis string when truncating the text by the `limit` prop's value.
	 *
	 * @default '…'
	 */
	ellipsis?: string;
	/**
	 * Determines where to truncate.  For example, we can truncate text right in
	 * the middle. To do this, we need to set `ellipsizeMode` to `middle` and a
	 * text `limit`.
	 *
	 * * `auto`: Trims content at the end automatically without a `limit`.
	 * * `head`: Trims content at the beginning. Requires a `limit`.
	 * * `middle`: Trims content in the middle. Requires a `limit`.
	 * * `tail`: Trims content at the end. Requires a `limit`.
	 *
	 * @default 'auto'
	 */
	ellipsizeMode?: TruncateEllipsizeMode;
	/**
	 * Determines the max number of characters to be displayed before the rest
	 * of the text gets truncated. Requires `ellipsizeMode` to assume values
	 * different from `auto` and `none`.
	 *
	 * @default 0
	 */
	limit?: number;
	/**
	 * Clamps the text content to the specified `numberOfLines`, adding an
	 * ellipsis at the end. Note: this feature ignores the value of the
	 * `ellipsis` prop and always displays the default `…` ellipsis.
	 *
	 * @default 0
	 */
	numberOfLines?: number;
	/**
	 * The children elements.
	 */
	children: ReactNode;
};
