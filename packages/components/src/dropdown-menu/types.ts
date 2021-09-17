/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

export type Props = {
	/**
	 * The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug to be shown in the collapsed menu button.
	 */
	icon?: JSX.Element;
	/**
	 * A human-readable label to present as accessibility text on the focused collapsed menu button..
	 *
	 * @default 'inherit'
	 */
	label: string;
	/**
	 * An array of objects describing the options to be shown in the expanded menu.
	 * Each object should include an `icon` [Dashicon](https://developer.wordpress.org/resource/dashicons/) slug string, a
	 * human-readable `title` string, `isDisabled` boolean flag and an `onClick` function callback to invoke when the option is selected.
	 * A valid DropdownMenu must specify one or the other of a `controls` or `children` prop.
	 */
	controls?: number;
	/**
	 * A [function render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render) which should return an element or
	 * elements valid for use in a DropdownMenu: `MenuItem`, `MenuItemsChoice`, or `MenuGroup`. Its first argument is a props object including
	 * the same values as given to a [`Dropdown`'s `renderContent`](/packages/components/src/dropdown#rendercontent) (`isOpen`, `onToggle`, `onClose`).
	 * A valid DropdownMenu must specify one or the other of a `controls` or `children` prop.
	 */
	children?: ReactNode;
	/**
	 * A class name to apply to the dropdown menu's toggle element wrapper.
	 *
	 */
	className?: string;
	/**
	 * Properties of `popoverProps` object will be passed as props to the nested `Popover` component.
	 * Use this object to modify props available for the `Popover` component that are not already exposed in the `DropdownMenu` component,
	 * e.g.: the direction in which the popover should open relative to its parent node set with `position` prop.
	 *
	 */
	popoverProps?: object;
	/**
	 * Properties of `toggleProps` object will be passed as props to the nested `Button` component in the `renderToggle` implementation of the
	 * `Dropdown` component used internally.
	 * Use this object to modify props available for the `Button` component that are not already exposed in the `DropdownMenu` component, e.g.:
	 * the tooltip text displayed on hover set with `tooltip` prop.
	 *
	 */
	toggleProps?: object;
	/**
	 * Properties of `menuProps` object will be passed as props to the nested `NavigableMenu` component in the `renderContent` implementation of
	 * the `Dropdown` component used internally.
	 * Use this object to modify props available for the `NavigableMenu` component that are not already exposed in the `DropdownMenu` component, e.g.:
	 * the orientation of the menu set with `orientation` prop.p.p.
	 *
	 */
	menuProps?: object;
	/**
	 * In some contexts, the arrow down key used to open the dropdown menu might need to be disabled—for example when that key is used to perform
	 * another action.
	 *
	 */
	disableOpenOnArrowDown?: boolean;
};
