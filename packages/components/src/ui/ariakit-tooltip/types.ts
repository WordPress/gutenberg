/**
 * External dependencies
 */
import type { TooltipStateProps } from 'ariakit/tooltip';

export type ToolTipProps = Pick< TooltipStateProps, 'placement' > & {
	/**
	 * The anchor for the tooltip. Accepts only one child element.
	 */
	children: React.ReactElement;
	/**
	 * The amount of time in milliseconds to wait before showing the tooltip.
	 *
	 * @default 700
	 */
	delay?: number;
	/**
	 * Option for adding accessible keyboard shortcuts.
	 */
	shortcut?: string | { display: string; ariaLabel: string };
	/**
	 * The text shown in the tooltip.
	 */
	text?: string;
};
