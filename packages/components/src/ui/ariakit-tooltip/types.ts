/**
 * External dependencies
 */
import type { TooltipStateProps } from 'ariakit/tooltip';
/**
 * Internal dependencies
 */
import type { PopoverProps } from '../../popover/types';
import type { ShortcutProps } from '../shortcut';

export type ToolTipProps = {
	/**
	 * The anchor for the tooltip. Accepts only one child element.
	 */
	children: React.ReactElement | string;
	/**
	 * The amount of time in milliseconds to wait before showing the tooltip.
	 *
	 * @default 700
	 */
	delay?: number;
	/**
	 * Where the tooltip should be positioned relative to its parent.
	 *
	 * @default bottom
	 */
	placement?: TooltipStateProps[ 'placement' ];
	/**
	 * _Note: this prop is deprecated. Please use the `placement` prop instead._
	 *
	 * Legacy way of specifying the tooltip's position relative to its parent.
	 *
	 * @deprecated
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
