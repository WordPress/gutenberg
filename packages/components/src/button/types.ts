/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { Props as IconProps } from '../icon';
import type { PopoverProps } from '../popover/types';
import type { WordPressComponentProps } from '../context/wordpress-component';

export type ButtonProps =
	| WordPressComponentProps< ButtonAsButtonProps, 'button', false >
	| WordPressComponentProps< ButtonAsAnchorProps, 'a', false >;

export type ButtonAsButtonProps = BaseButtonProps & _ButtonProps;
export type ButtonAsAnchorProps = BaseButtonProps & AnchorProps;

type BaseButtonProps = {
	/**
	 * Start opting into the larger default height that will become the
	 * default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * The button's children.
	 */
	children?: ReactNode;
	/**
	 * An accessible description for the button.
	 */
	describedBy?: string;
	/**
	 * If provided, renders an Icon component inside the button.
	 */
	icon?: IconProps[ 'icon' ];
	/**
	 * If provided with `icon`, sets the position of icon relative to the `text`.
	 *
	 * @default 'left'
	 */
	iconPosition?: 'left' | 'right';
	/**
	 * If provided with `icon`, sets the icon size.
	 * Please refer to the Icon component for more details regarding
	 * the default value of its `size` prop.
	 */
	iconSize?: IconProps[ 'size' ];
	/**
	 * Indicates activity while a action is being performed.
	 */
	isBusy?: boolean;
	/**
	 * Renders a red text-based button style to indicate destructive behavior.
	 */
	isDestructive?: boolean;
	/**
	 * Renders a pressed button style.
	 */
	isPressed?: boolean;
	/**
	 * Sets the `aria-label` of the component, if none is provided.
	 * Sets the Tooltip content if `showTooltip` is provided.
	 */
	label?: string;
	/**
	 * If provided with `showTooltip`, appends the Shortcut label to the tooltip content.
	 * If an object is provided, it should contain `display` and `ariaLabel` keys.
	 */
	shortcut?: string | { display: string; ariaLabel: string };
	/**
	 * If provided, renders a Tooltip component for the button.
	 */
	showTooltip?: boolean;
	/**
	 * The size of the button.
	 *
	 * - `'default'`: For normal text-label buttons, unless it is a toggle button.
	 * - `'compact'`: For toggle buttons, icon buttons, and buttons when used in context of either.
	 * - `'small'`: For icon buttons associated with more advanced or auxiliary features.
	 *
	 * If the deprecated `isSmall` prop is also defined, this prop will take precedence.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact' | 'small';
	/**
	 * If provided, displays the given text inside the button. If the button contains children elements, the text is displayed before them.
	 */
	text?: string;
	/**
	 * If provided with `showTooltip`, sets the position of the tooltip.
	 * Please refer to the Tooltip component for more details regarding the defaults.
	 */
	tooltipPosition?: PopoverProps[ 'position' ];
	/**
	 * Specifies the button's style.
	 * The accepted values are:
	 * 'primary' (the primary button styles)
	 * 'secondary' (the default button styles)
	 * 'tertiary' (the text-based button styles)
	 * 'link' (the link button styles)
	 */
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
	/**
	 * Whether to keep the button focusable when disabled.
	 *
	 * @default false
	 */
	__experimentalIsFocusable?: boolean;
};

type _ButtonProps = {
	/**
	 * Whether the button is disabled.
	 *
	 * If `true`, this will force a `button` element to be rendered, even when an `href` is given.
	 */
	disabled?: boolean;
};

type AnchorProps = {
	/**
	 * Whether the button is disabled.
	 *
	 * If `true`, this will force a `button` element to be rendered, even when an `href` is given.
	 */
	disabled?: false;
	/**
	 * If provided, renders `a` instead of `button`.
	 */
	href: string;
	/**
	 * If provided with `href`, sets the `target` attribute to the `a`.
	 */
	target?: string;
};

export type DeprecatedButtonProps = {
	/**
	 * Gives the button a default style.
	 *
	 * @deprecated Use the `'secondary'` value on the `variant` prop instead.
	 * @ignore
	 */
	isDefault?: boolean;
	/**
	 * Gives the button a link style.
	 *
	 * @deprecated Use the `'link'` value on the `variant` prop instead.
	 * @ignore
	 */
	isLink?: boolean;
	/**
	 * Gives the button a primary style.
	 *
	 * @deprecated Use the `'primary'` value on the `variant` prop instead.
	 * @ignore
	 */
	isPrimary?: boolean;
	/**
	 * Gives the button a default style.
	 *
	 * @deprecated Use the `'secondary'` value on the `variant` prop instead.
	 * @ignore
	 */
	isSecondary?: boolean;
	/**
	 * Gives the button a text-based style.
	 *
	 * @deprecated Use the `'tertiary'` value on the `variant` prop instead.
	 * @ignore
	 */
	isTertiary?: boolean;
	/**
	 * Decreases the size of the button.
	 *
	 * @deprecated Use the `'small'` value on the `size` prop instead.
	 * @ignore
	 */
	isSmall?: boolean;
};

export type DeprecatedIconButtonProps = {
	labelPosition: ButtonProps[ 'tooltipPosition' ];
	showTooltip?: boolean;
	size: ButtonProps[ 'iconSize' ];
	label: ButtonProps[ 'label' ];
	tooltip: ButtonProps[ 'label' ];
};
