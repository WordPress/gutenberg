/**
 * External dependencies
 */
import type { TooltipStateProps } from 'ariakit/tooltip';

export type ToolTipProps = Pick<
	TooltipStateProps,
	'placement' | 'timeout'
> & {
	/**
	 * The anchor for the tooltip. Accepts only one child element.
	 */
	children: React.ReactNode;
	/**
	 * The text shown in the tooltip.
	 */
	text: string;
};
