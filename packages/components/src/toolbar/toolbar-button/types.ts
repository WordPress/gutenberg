/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ToolbarButtonProps = {
	/**
	 * Children to be rendered inside the button.
	 */
	children?: ReactNode;
	/**
	 * An optional class name for the button container.
	 */
	containerClassName?: string;
	/**
	 * Additional props to be passed alongside props.
	 */
	extraProps?: any;
	/**
	 * Indicates if the button is active.
	 */
	isActive?: boolean;
	/**
	 * Indicates if the button is disabled.
	 *
	 * @deprecated Use `disabled` instead.
	 * @ignore
	 */
	isDisabled?: boolean;
	/**
	 * An optional subscript for the button.
	 */
	subscript?: string;
	/**
	 * An optional title/label for the button.
	 */
	title?: string;
};

export type ToolbarButtonOverriddenProps = {
	/**
	 * Whether to keep the button focusable when disabled.
	 *
	 * In most cases, it is recommended to set this to `true`. Disabling a control without maintaining focusability
	 * can cause accessibility issues, by hiding their presence from screen reader users,
	 * or by preventing focus from returning to a trigger element.
	 *
	 * Learn more about the [focusability of disabled controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols)
	 * in the WAI-ARIA Authoring Practices Guide.
	 *
	 * @default true
	 */
	accessibleWhenDisabled?: boolean;
};

export type ToolbarButtonContainerProps = {
	/**
	 * Children to be rendered inside the button container.
	 */
	children?: ReactNode;
	/**
	 * An optional class name for the button container.
	 */
	className?: string;
};
