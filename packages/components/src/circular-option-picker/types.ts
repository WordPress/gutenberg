/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import type { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';
import type Dropdown from '../dropdown';
import type { WordPressComponentProps } from '../ui/context';

export type CircularOptionPickerProps = {
	/**
	 * A CSS class to apply to the wrapper element.
	 */
	className?: string;
	/**
	 * The action(s) to be rendered after the options,
	 * such as a 'clear' button as seen in `ColorPalette`.
	 * Usually a `CircularOptionPicker.ButtonAction` or
	 * `CircularOptionPicker.DropdownLinkAction` component.
	 */
	actions?: ReactNode;
	/**
	 * The options to be rendered, such as color swatches.
	 * Usually a `CircularOptionPicker.Option` component.
	 */
	options: ReactNode;
	/**
	 * The child elements.
	 */
	children?: ReactNode;
};

export type DropdownLinkActionProps = {
	buttonProps?: Omit<
		WordPressComponentProps< ButtonAsButtonProps, 'button', false >,
		'children'
	>;
	linkText: string;
	dropdownProps: Omit<
		React.ComponentProps< typeof Dropdown >,
		'className' | 'renderToggle'
	>;
	className?: string;
};

export type OptionProps = Omit<
	WordPressComponentProps< ButtonAsButtonProps, 'button', false >,
	'isPressed' | 'className'
> & {
	className?: string;
	tooltipText?: string;
	isSelected?: boolean;
	// `icon` is explicitly defined as 'check' by CircleOptionPicker.Option
	// and is not intended to be overridden.
	// `size` relies on the `Icon` component's default size of `24` to fit
	// `CircularOptionPicker`'s design, and should not be explicitly set.
	selectedIconProps?: Omit<
		React.ComponentProps< typeof Icon >,
		'icon' | 'size'
	>;
};
