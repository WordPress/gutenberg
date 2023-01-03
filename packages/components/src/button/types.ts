/**
 * External dependencies
 */
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { Props as IconProps } from '../icon';

export type ButtonProps = {
	/**
	 * Whether the button is disabled.
	 * If `true`, this will force a `button` element to be rendered.
	 */
	disabled?: boolean;
	/**
	 * If provided, renders `a` instead of `button`.
	 */
	href?: string;
	/**
	 * Specifies the button's style.
	 * The accepted values are:
	 * `'primary'` (the primary button styles),
	 * `'secondary'` (the default button styles),
	 * `'tertiary'` (the text-based button styles), and
	 * `'link'` (the link button styles).
	 */
	variant: 'primary' | 'secondary' | 'tertiary' | 'link';
	/**
	 * Renders a red text-based button style to indicate destructive behavior.
	 */
	isDestructive?: boolean;
	/**
	 * Decreases the size of the button.
	 */
	isSmall?: boolean;
	/**
	 * Renders a pressed button style.
	 */
	isPressed?: boolean;
	/**
	 * Indicates activity while a action is being performed.
	 */
	isBusy?: boolean;
	/**
	 * The button's children.
	 */
	children?: ReactNode;
	/**
	 * The accessible description for the button.
	 */
	describedBy?: string;
	/**
	 * Whether the button is focused.
	 */
	focus?: boolean;
	/**
	 * If provided with `href`, sets the `target` attribute to the `a`.
	 */
	target?: string;
	/**
	 * If provided, renders an Icon component inside the button.
	 */
	icon?: IconProps< unknown >[ 'icon' ];
	/**
	 * If provided with `icon`, sets the icon size.
	 * Please refer to the Icon component for more details regarding
	 * the default value of its `size` prop.
	 */
	iconSize?: IconProps< unknown > [ 'size' ]
	/**
	 * If provided with `icon`, sets the position of icon relative to the `text`.
	 *
	 * @default 'left'
	 */
	iconPosition?: 'left' | 'right';
	/**
	 * If provided, displays the given text inside the button. If the button contains children elements, the text is displayed before them.
	 */
	text?: string;
	/**
	 * If provided, renders a Tooltip component for the button.
	 */
	showTooltip?: boolean;
	/**
	 * If provided with `showTooltip`, sets the position of the tooltip.
	 * Please refer to the Tooltip component for more details regarding the defaults.
	 */
	tooltipPosition?: string;
	/**
	 * If provided with `showTooltip`, appends the Shortcut label to the tooltip content.
	 * If an `Object` is provided, it should contain `display` and `ariaLabel` keys.
	 */
	shortcut?: string | Object;
	/**
	 * Sets the `aria-label` of the component, if none is provided.
	 * Sets the Tooltip content if `showTooltip` is provided.
	 */
	label?: string;
	/**
	 * Whether this is focusable.
	 */
	__experimentalIsFocusable?: boolean;
}

export type DeprecatedButtonProps = {
	isDefault?: boolean;
	isPrimary?: boolean;
	isSecondary?: boolean;
	isTertiary?: boolean;
	isLink?: boolean;
}

export type DisabledEvents = {
	onMouseDown: MouseEvent;
	onClick: KeyboardEvent;
};

export type TagName = 'a' | 'button';
