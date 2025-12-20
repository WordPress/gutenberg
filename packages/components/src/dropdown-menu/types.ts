/**
 * External dependencies
 */
import type { HTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';
import type { WordPressComponentProps } from '../context';
import type { DropdownProps } from '../dropdown/types';
import type { Props as IconProps } from '../icon';
import type { NavigableMenuProps } from '../navigable-container/types';

export type DropdownOption = {
	/**
	 * The icon to be shown for the option.
	 */
	icon?: IconProps[ 'icon' ];
	/**
	 * A human-readable title to display for the option.
	 */
	title: string;
	/**
	 * Whether or not the option is disabled.
	 *
	 * @default false
	 */
	isDisabled?: boolean;
	/**
	 * A callback function to invoke when the option is selected.
	 */
	onClick?: ( event?: React.MouseEvent ) => void;
	/**
	 * Whether or not the control is currently active.
	 */
	isActive?: boolean;
	/**
	 * Text to use for the internal `Button` component's tooltip.
	 */
	label?: string;
	/**
	 * The role to apply to the option's HTML element
	 */
	role?: HTMLAttributes< HTMLElement >[ 'role' ];
};

type DropdownCallbackProps = {
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
};

// Manually including `as` prop because `WordPressComponentProps` polymorphism
// creates a union that is too large for TypeScript to handle.
type ToggleProps = Partial<
	Omit<
		WordPressComponentProps< ButtonAsButtonProps, 'button', false >,
		'label' | 'text'
	>
> & {
	as?: React.ElementType | keyof JSX.IntrinsicElements;
	'data-toolbar-item'?: boolean;
};

export type DropdownMenuProps = {
	/**
	 * The icon to be shown in the collapsed menu button.
	 *
	 * @default "menu"
	 */
	icon?: IconProps[ 'icon' ] | null;
	/**
	 * A human-readable label to present as accessibility text on the focused
	 * collapsed menu button.
	 */
	label: string;
	/**
	 * A class name to apply to the dropdown menu's toggle element wrapper.
	 */
	className?: string;
	/**
	 * Properties of `popoverProps` object will be passed as props to the nested
	 * `Popover` component.
	 * Use this object to modify props available for the `Popover` component that
	 * are not already exposed in the `DropdownMenu` component, e.g.: the
	 * direction in which the popover should open relative to its parent node
	 * set with `position` prop.
	 */
	popoverProps?: DropdownProps[ 'popoverProps' ];
	/**
	 * Properties of `toggleProps` object will be passed as props to the nested
	 * `Button` component in the `renderToggle` implementation of the `Dropdown`
	 * component used internally.
	 * Use this object to modify props available for the `Button` component that
	 * are not already exposed in the `DropdownMenu` component, e.g.: the tooltip
	 * text displayed on hover set with `tooltip` prop.
	 */
	toggleProps?: ToggleProps;
	/**
	 * Properties of `menuProps` object will be passed as props to the nested
	 * `NavigableMenu` component in the `renderContent` implementation of the
	 * `Dropdown` component used internally.
	 * Use this object to modify props available for the `NavigableMenu`
	 * component that are not already exposed in the `DropdownMenu` component,
	 * e.g.: the orientation of the menu set with `orientation` prop.
	 */
	menuProps?: Omit< Partial< NavigableMenuProps >, 'children' >;
	/**
	 * In some contexts, the arrow down key used to open the dropdown menu might
	 * need to be disabled—for example when that key is used to perform another
	 * action.
	 *
	 * @default false
	 */
	disableOpenOnArrowDown?: boolean;
	/**
	 * Text to display on the nested `Button` component in the `renderToggle`
	 * implementation of the `Dropdown` component used internally.
	 */
	text?: string;
	/**
	 * Whether or not `no-icons` should be added to the menu's `className`.
	 */
	noIcons?: boolean;
	/**
	 * A [function render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render)
	 * which should return an element or elements valid for use in a DropdownMenu:
	 * `MenuItem`, `MenuItemsChoice`, or `MenuGroup`. Its first argument is a
	 * props object including the same values as given to a `Dropdown`'s
	 * `renderContent` (`isOpen`, `onToggle`, `onClose`).
	 *
	 * A valid DropdownMenu must specify a `controls` or `children` prop, or both.
	 */
	children?: ( callbackProps: DropdownCallbackProps ) => ReactNode;
	/**
	 * An array or nested array of objects describing the options to be shown in
	 * the expanded menu. Each object should include an `icon` Dashicon slug
	 * string, a human-readable `title` string, `isDisabled` boolean flag, and
	 * an `onClick` function callback to invoke when the option is selected.
	 *
	 * A valid DropdownMenu must specify a `controls` or `children` prop, or both.
	 */
	controls?: DropdownOption[] | DropdownOption[][];
	/**
	 * The controlled open state of the dropdown menu.
	 * Must be used in conjunction with `onToggle`.
	 */
	open?: boolean;
	/**
	 * The open state of the dropdown menu when initially rendered.
	 * Use when you do not need to control its open state. It will be overridden
	 * by the `open` prop if it is specified on the component's first render.
	 */
	defaultOpen?: boolean;
	/**
	 * A callback invoked when the state of the dropdown menu changes
	 * from open to closed and vice versa.
	 */
	onToggle?: ( willOpen: boolean ) => void;
};

export type DropdownMenuInternalContext = {
	/**
	 * This variant can be used to change the appearance of the component in
	 * specific contexts, ie. when rendered inside the `Toolbar` component.
	 */
	variant?: 'toolbar';
};
