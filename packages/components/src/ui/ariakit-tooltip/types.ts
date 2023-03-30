/**
 * External dependencies
 */
import type { TooltipStateProps } from 'ariakit/tooltip';

export type ToolTipProps = Pick< TooltipStateProps, 'placement' > & {
	/**
	 * The anchor for the tooltip. Accepts only one child element.
	 */
	children: JSX.Element;
	/**
	 * The amount of time in milliseconds to wait before showing the tooltip.
	 *
	 * @default 700
	 */
	delay?: number;
	/**
	 * Where the tooltip should be positioned relative to its parent.
	 *
	 * @default
	 */
	placement?: any; //Placement | undefinded;
	/**
	 * _Note: this prop is deprecated. Please use the `placement` prop instead._
	 *
	 * Legacy way of specifying the tooltip's position relative to its parent.
	 *
	 * @default top center
	 */
	position?: string;
	/**
	 * Option for adding accessible keyboard shortcuts.
	 */
	shortcut?: string | { display: string; ariaLabel: string };
	/**
	 * The text shown in the tooltip when anchor element is focused or hovered.
	 */
	text?: string;
};
