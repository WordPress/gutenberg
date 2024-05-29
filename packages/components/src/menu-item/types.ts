/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';

export type MenuItemProps = Pick< ButtonAsButtonProps, 'isDestructive' > & {
	/**
	 * A CSS `class` to give to the container element.
	 */
	className?: string;
	/**
	 * The children elements.
	 */
	children?: ReactNode;
	/**
	 * Text to use as description for button text.
	 */
	info?: string;
	/**
	 * The icon to render. Supported values are: Dashicons (specified as
	 * strings), functions, Component instances and `null`.
	 *
	 * @default null
	 */
	icon?: JSX.Element | null;
	/**
	 * Determines where to display the provided `icon`.
	 */
	iconPosition?: ButtonAsButtonProps[ 'iconPosition' ];
	/**
	 * Whether or not the menu item is currently selected, `isSelected` is only taken into
	 * account when the `role` prop is either `"menuitemcheckbox"` or `"menuitemradio"`.
	 */
	isSelected?: boolean;
	/**
	 * If shortcut is a string, it is expecting the display text. If shortcut is an object,
	 * it will accept the properties of `display` (string) and `ariaLabel` (string).
	 */
	shortcut?: string | { display: string; ariaLabel: string };
	/**
	 * If you need to have selectable menu items use menuitemradio for single select,
	 * and menuitemcheckbox for multiselect.
	 *
	 * @default 'menuitem'
	 */
	role?: string;
	/**
	 * Allows for markup other than icons or shortcuts to be added to the menu item.
	 *
	 */
	suffix?: ReactNode;
	/**
	 * Human-readable label for item.
	 */
	label?: string;
};
