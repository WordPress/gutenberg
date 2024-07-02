/**
 * External dependencies
 */
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type Popover from '../popover';
import type { PopoverProps } from '../popover/types';

type CallbackProps = {
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
};

export type DropdownContentWrapperProps = {
	/**
	 * Amount of padding to apply on the dropdown content.
	 *
	 * @default 'small'
	 */
	paddingSize?: 'none' | 'small' | 'medium';
};

export type DropdownProps = {
	/**
	 * The className of the global container.
	 */
	className?: string;
	/**
	 * If you want to target the dropdown menu for styling purposes,
	 * you need to provide a contentClassName because it's not being rendered
	 * as a child of the container node.
	 */
	contentClassName?: string;
	/**
	 * Opt-in prop to show popovers fullscreen on mobile.
	 *
	 * @default false
	 */
	expandOnMobile?: boolean;
	/**
	 * By default, the first tabbable element in the popover will receive focus
	 * when it mounts. This is the same as setting this prop to "firstElement".
	 * Specifying a true value will focus the container instead.
	 * Specifying a false value disables the focus handling entirely
	 * (this should only be done when an appropriately accessible
	 * substitute behavior exists).
	 *
	 * @default 'firstElement'
	 */
	focusOnMount?: 'firstElement' | boolean;
	/**
	 * Set this to customize the text that is shown in the dropdown's header
	 * when it is fullscreen on mobile.
	 */
	headerTitle?: string;
	/**
	 * A callback invoked when the popover should be closed.
	 */
	onClose?: () => void;
	/**
	 * A callback invoked when the state of the dropdown changes
	 * from open to closed and vice versa.
	 */
	onToggle?: ( willOpen: boolean ) => void;
	/**
	 * Properties of popoverProps object will be passed as props
	 * to the Popover component.
	 * Use this object to access properties/features
	 * of the Popover component that are not already exposed
	 * in the Dropdown component,
	 * e.g.: the ability to have the popover without an arrow.
	 */
	popoverProps?: Omit<
		ComponentPropsWithoutRef< typeof Popover >,
		'children'
	>;
	/**
	 * A callback invoked to render the content of the dropdown menu.
	 * Its first argument is the same as the renderToggle prop.
	 */
	renderContent: ( props: CallbackProps ) => ReactNode;
	/**
	 * A callback invoked to render the Dropdown Toggle Button.
	 *
	 * The first argument of the callback is an object
	 * containing the following properties:
	 *
	 * - isOpen: whether the dropdown menu is opened or not
	 * - onToggle: A function switching the dropdown menu's state
	 * from open to closed and vice versa
	 * - onClose: A function that closes the menu if invoked
	 */
	renderToggle: ( props: CallbackProps ) => ReactNode;
	/**
	 * The style of the global container.
	 */
	style?: CSSProperties;
	/**
	 * Legacy way to specify the popover's position with respect to its anchor.
	 * For details about the possible values, see the `Popover` component's docs.
	 * _Note: this prop is deprecated. Use the `popoverProps.placement` prop
	 * instead._
	 *
	 * @deprecated
	 */
	position?: PopoverProps[ 'position' ];
	/**
	 * The controlled open state of the dropdown.
	 * Must be used in conjunction with `onToggle`.
	 */
	open?: boolean;
	/**
	 * The open state of the dropdown when initially rendered.
	 * Use when you do not need to control its open state. It will be overridden
	 * by the `open` prop if it is specified on the component's first render.
	 */
	defaultOpen?: boolean;
};

export type DropdownInternalContext = {
	/**
	 * This variant can be used to change the appearance of the component in
	 * specific contexts, ie. when rendered inside the `Toolbar` component.
	 */
	variant?: 'toolbar';
};
