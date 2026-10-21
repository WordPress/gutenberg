import type { ReactElement } from 'react';
import { type ComponentProps } from '../utils/types';
import type { PopupProps } from '../popover/types';

export interface BadgeProps extends ComponentProps< 'span' > {
	/**
	 * The text to display in the badge.
	 */
	children: string;

	/**
	 * An optional `Popover.Popup` composition explaining the badge's status.
	 * Include a `Popover.Title`, which can be visually hidden.
	 *
	 * The whole badge becomes a button that opens the popup on hover or
	 * activation. When customizing `render`, preserve a native button element.
	 * Keep content brief and prefer at most one related link or action.
	 */
	infotip?: ReactElement< PopupProps >;

	/**
	 * The semantic intent of the badge, communicating its meaning through color.
	 *
	 * @default "none"
	 */
	intent?:
		| 'high'
		| 'medium'
		| 'low'
		| 'stable'
		| 'informational'
		| 'draft'
		| 'none';
}
