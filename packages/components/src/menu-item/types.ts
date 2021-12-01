/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

export type MenuItemProps = {
	/**
	 * Text to be displayed beneath a menu item.
	 */
	info?: string;
	/**
	 * An optional class name for the MenuItem container.
	 */
	className?: string;
	/**
	 * A role attribute value for the Button component.
	 *
	 * @default 'menuitem'
	 */
	role?: string;
	/**
	 * A position value for the MenuItem icon.
	 *
	 * @default 'right'
	 */
	iconPosition?: 'right' | 'left';
	/**
	 * Child elements.
	 */
	children: ReactNode;
	/**
	 * The shortcut prop for <Shortcut />.
	 */
	shortcut?: string | { display: string; ariaLabel: string };
	/**
	 * Whether the is MenuItem selected.
	 */
	isSelected?: boolean;
};

export type MenuItemInfoWrapperProps = {
	/**
	 * Text to be displayed beneath a menu item.
	 */
	info?: string;
	/**
	 * Child elements.
	 */
	children: ReactNode;
}
