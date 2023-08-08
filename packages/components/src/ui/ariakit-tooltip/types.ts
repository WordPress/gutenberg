/**
 * External dependencies
 */
import type { TooltipProps } from '@ariakit/react/tooltip';
/**
 * Internal dependencies
 */
import type { PopoverProps } from '../../popover/types';
import type { ShortcutProps } from '../shortcut';

export type ToolTipProps = {
	/**
	 * The anchor for the tooltip. Accepts only one child element.
	 */
	children: TooltipProps[ 'render' ];
	/**
	 * The amount of time in milliseconds to wait before showing the tooltip.
	 *
	 * @default 700
	 */
	delay?: number;
	/**
	 * The direction in which the tooltip should open relative to its parent node.
	 *
	 * @default bottom
	 */
	position?: PopoverProps[ 'position' ];
	/**
	 * Option for adding accessible keyboard shortcuts.
	 */
	shortcut?: ShortcutProps[ 'shortcut' ];
	/**
	 * The text shown in the tooltip when anchor element is focused or hovered.
	 */
	text?: string;
};
