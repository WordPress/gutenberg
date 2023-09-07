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
	 * The amount of time in milliseconds to wait before showing the tooltip.
	 *
	 * @default 700
	 */
	delay?: number;
	/**
	 * The direction in which the tooltip should open relative to its parent node.
	 * Specify y- and x-axis as a space-separated string. Supports `"top"`,
	 * `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.
	 *
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
