/**
 * External dependencies
 */
import type { Placement } from '@floating-ui/react-dom';

/**
 * Internal dependencies
 */
import type { PopoverProps } from '../popover/types';
import type { ShortcutProps } from '../shortcut/types';

export type TooltipProps = {
	/**
	 * The anchor for the tooltip.
	 *
	 * **Note**: Accepts only one child element.
	 */
	children: React.ReactElement;
	/**
	 * Custom class name for the tooltip.
	 */
	className?: string;
	/**
	 * Option to hide the tooltip when the anchor is clicked.
	 *
	 * @default true
	 */
	hideOnClick?: boolean;
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
	placement?: Placement;
	/**
	 * _Note: this prop is deprecated. Please use the `placement` prop instead._
	 *
	 * Legacy way of specifying the tooltip's position relative to its parent.
	 *
	 * Specify y- and x-axis as a space-separated string. Supports `"top"`,
	 * `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.
	 *
	 * @deprecated
	 * @default bottom
	 */
	position?: PopoverProps[ 'position' ];
	/**
	 * An option for adding accessible keyboard shortcuts.
	 *
	 * If shortcut is a string, it is expecting the display text. If shortcut is an
	 * object, it will accept the properties of `display` (string) and `ariaLabel`
	 * (string).
	 */
	shortcut?: ShortcutProps[ 'shortcut' ];
	/**
	 * The text shown in the tooltip when anchor element is focused or hovered.
	 */
	text?: string;
};

export type TooltipInternalContext = {
	isNestedInTooltip: boolean;
};
