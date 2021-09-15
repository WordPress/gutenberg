/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

export type Props = {
	/**
	 * Element to render as child of button.
	 */
	children?: ReactNode;
	/**
	 * Text to use as description for button text.
	 * Refer to documentation for [`label`](#label).
	 */
	info?: string;
	/**
	 * Refer to documentation for [Button's `icon` prop](/packages/components/src/icon-button/README.md#icon).
	 */
	icon?: string | JSX.Element;
	/**
	 * Whether or not the menu item is currently selected.
	 */
	isSelected?: boolean;
	/**
	 * Refer to documentation for [Shortcut's `shortcut` prop](/packages/components/src/shortcut/README.md#shortcut).
	 */
	shortcut?: string;
	/**
	 * [Aria Spec](https://www.w3.org/TR/wai-aria-1.1/#aria-checked). If you need to have selectable menu items use menuitemradio for
	 * single select, and menuitemcheckbox for multiselect.
	 */
	role?: string;
	/**
	 * Handler for click events.
	 */
	onClick?: () => void;
	/**
	 * Flag to indicate if the menu item is disabled.
	 */
	disabled?: boolean;
};
