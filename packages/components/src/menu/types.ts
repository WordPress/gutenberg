/**
 * External dependencies
 */
import type * as Ariakit from '@ariakit/react';

export interface ContextProps {
	/**
	 * The ariakit store shared across all Menu subcomponents.
	 */
	store: Ariakit.MenuStore;
	/**
	 * The variant used by the underlying menu popover.
	 */
	variant?: 'toolbar';
}

export interface Props {
	/**
	 * The elements, which should include one instance of the `Menu.TriggerButton`
	 * component and one instance of the `Menu.Popover` component.
	 */
	children?: Ariakit.MenuProviderProps[ 'children' ];
	/**
	 * Whether the menu popover and its contents should be visible by default.
	 *
	 * Note: this prop will be overridden by the `open` prop if it is
	 * provided (meaning the component will be used in "controlled" mode).
	 *
	 * @default false
	 */
	defaultOpen?: Ariakit.MenuProviderProps[ 'defaultOpen' ];
	/**
	 * Whether the menu popover and its contents should be visible.
	 * Should be used in conjunction with `onOpenChange` in order to control
	 * the open state of the menu popover.
	 *
	 * Note: this prop will set the component in "controlled" mode, and it will
	 * override the `defaultOpen` prop.
	 */
	open?: Ariakit.MenuProviderProps[ 'open' ];
	/**
	 * A callback that gets called when the `open` state changes.
	 */
	onOpenChange?: Ariakit.MenuProviderProps[ 'setOpen' ];
	/**
	 * The placement of the menu popover.
	 *
	 * @default 'bottom-start' for root-level menus, 'right-start' for submenus
	 */
	placement?: Ariakit.MenuProviderProps[ 'placement' ];
}

export interface PopoverProps {
	/**
	 * The contents of the menu popover, which should include instances of the
	 * `Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioItem`, `Menu.Group`, and
	 * `Menu.Separator` components.
	 */
	children?: Ariakit.MenuProps[ 'children' ];
	/**
	 * The modality of the menu popover. When set to true, interaction with
	 * outside elements will be disabled and only menu content will be visible to
	 * screen readers.
	 *
	 * Determines whether the menu popover is modal. Modal dialogs have distinct
	 * states and behaviors:
	 * - The `portal` and `preventBodyScroll` props are set to `true`. They can
	 *   still be manually set to `false`.
	 * - When the dialog is open, element tree outside it will be inert.
	 *
	 * @default true
	 */
	modal?: Ariakit.MenuProps[ 'modal' ];
	/**
	 * The distance between the popover and the anchor element.
	 *
	 * @default 8 for root-level menus, 16 for nested menus
	 */
	gutter?: Ariakit.MenuProps[ 'gutter' ];
	/**
	 * The skidding of the popover along the anchor element. Can be set to
	 * negative values to make the popover shift to the opposite side.
	 *
	 * @default 0 for root-level menus, -8 for nested menus
	 */
	shift?: Ariakit.MenuProps[ 'shift' ];
	/**
	 * Determines if the menu popover will hide when the user presses the
	 * Escape key.
	 *
	 * This prop can be either a boolean or a function that accepts an event as an
	 * argument and returns a boolean. The event object represents the keydown
	 * event that initiated the hide action, which could be either a native
	 * keyboard event or a React synthetic event.
	 *
	 * @default `( event ) => { event.preventDefault(); return true; }`
	 */
	hideOnEscape?: Ariakit.MenuProps[ 'hideOnEscape' ];
}

export interface TriggerButtonProps {
	/**
	 * The contents of the menu trigger button.
	 */
	children?: Ariakit.MenuButtonProps[ 'children' ];
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.MenuButtonProps[ 'render' ];
	/**
	 * Determines if the element is disabled. This sets the `aria-disabled`
	 * attribute accordingly, enabling support for all elements, including those
	 * that don't support the native `disabled` attribute.
	 *
	 * This feature can be combined with the `accessibleWhenDisabled` prop to
	 * make disabled elements still accessible via keyboard.
	 *
	 * @default false
	 */
	disabled?: Ariakit.MenuButtonProps[ 'disabled' ];
	/**
	 * Indicates whether the element should be focusable even when it is
	 * `disabled`.
	 *
	 * This is important when discoverability is a concern. For example:
	 *
	 * > A toolbar in an editor contains a set of special smart paste functions
	 * that are disabled when the clipboard is empty or when the function is not
	 * applicable to the current content of the clipboard. It could be helpful to
	 * keep the disabled buttons focusable if the ability to discover their
	 * functionality is primarily via their presence on the toolbar.
	 *
	 * Learn more on [Focusability of disabled
	 * controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).
	 */
	accessibleWhenDisabled?: Ariakit.MenuButtonProps[ 'accessibleWhenDisabled' ];
}

export interface GroupProps {
	/**
	 * The contents of the menu group, which should include one instance of the
	 * `Menu.GroupLabel` component and one or more instances of `Menu.Item`,
	 * `Menu.CheckboxItem`, and `Menu.RadioItem`.
	 */
	children: Ariakit.MenuGroupProps[ 'children' ];
}

export interface GroupLabelProps {
	/**
	 * The contents of the menu group label, which should provide an accessible
	 * label for the menu group.
	 */
	children: Ariakit.MenuGroupLabelProps[ 'children' ];
}

export interface ItemProps {
	/**
	 * The contents of the menu item, which could include one instance of the
	 * `Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
	 * component.
	 */
	children: Ariakit.MenuItemProps[ 'children' ];
	/**
	 * The contents of the menu item's prefix, such as an icon.
	 */
	prefix?: React.ReactNode;
	/**
	 * The contents of the menu item's suffix, such as a keyboard shortcut.
	 */
	suffix?: React.ReactNode;
	/**
	 * Determines if the menu should hide when this item is clicked.
	 *
	 * **Note**: This behavior isn't triggered if this menu item is rendered as a
	 * link and modifier keys are used to either open the link in a new tab or
	 * download it.
	 *
	 * @default true
	 */
	hideOnClick?: Ariakit.MenuItemProps[ 'hideOnClick' ];
	/**
	 * Determines if the element is disabled. This sets the `aria-disabled`
	 * attribute accordingly, enabling support for all elements, including those
	 * that don't support the native `disabled` attribute.
	 *
	 * @default false
	 */
	disabled?: Ariakit.MenuItemProps[ 'disabled' ];
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.MenuItemProps[ 'render' ];
	/**
	 * The ariakit menu store. This prop is only meant for internal use.
	 * @ignore
	 */
	store?: Ariakit.MenuItemProps[ 'store' ];
}

export interface CheckboxItemProps {
	/**
	 * The contents of the menu item, which could include one instance of the
	 * `Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
	 * component.
	 */
	children: Ariakit.MenuItemCheckboxProps[ 'children' ];
	/**
	 * The contents of the menu item's suffix, such as a keyboard shortcut.
	 */
	suffix?: React.ReactNode;
	/**
	 * Determines if the menu should hide when this item is clicked.
	 *
	 * **Note**: This behavior isn't triggered if this menu item is rendered as a
	 * link and modifier keys are used to either open the link in a new tab or
	 * download it.
	 *
	 * @default false
	 */
	hideOnClick?: Ariakit.MenuItemCheckboxProps[ 'hideOnClick' ];
	/**
	 * Determines if the element is disabled. This sets the `aria-disabled`
	 * attribute accordingly, enabling support for all elements, including those
	 * that don't support the native `disabled` attribute.
	 *
	 * @default false
	 */
	disabled?: Ariakit.MenuItemCheckboxProps[ 'disabled' ];
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.MenuItemCheckboxProps[ 'render' ];
	/**
	 * The checkbox menu item's name.
	 */
	name: Ariakit.MenuItemCheckboxProps[ 'name' ];
	/**
	 * The checkbox item's value, useful when using multiple checkbox menu items
	 * associated to the same `name`.
	 */
	value?: Ariakit.MenuItemCheckboxProps[ 'value' ];
	/**
	 * The controlled checked state of the checkbox menu item.
	 *
	 * Note: this prop will override the `defaultChecked` prop.
	 */
	checked?: Ariakit.MenuItemCheckboxProps[ 'checked' ];
	/**
	 * The checked state of the checkbox menu item when it is initially rendered.
	 * Use when not wanting to control its checked state.
	 *
	 * Note: this prop will be overriden by the `checked` prop, if it is defined.
	 */
	defaultChecked?: Ariakit.MenuItemCheckboxProps[ 'defaultChecked' ];
	/**
	 * A function that is called when the checkbox's checked state changes.
	 */
	onChange?: Ariakit.MenuItemCheckboxProps[ 'onChange' ];
}

export interface RadioItemProps {
	/**
	 * The contents of the menu item, which could include one instance of the
	 * `Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
	 * component.
	 */
	children: Ariakit.MenuItemRadioProps[ 'children' ];
	/**
	 * The contents of the menu item's suffix, such as a keyboard shortcut.
	 */
	suffix?: React.ReactNode;
	/**
	 * Determines if the menu should hide when this item is clicked.
	 *
	 * **Note**: This behavior isn't triggered if this menu item is rendered as a
	 * link and modifier keys are used to either open the link in a new tab or
	 * download it.
	 *
	 * @default false
	 */
	hideOnClick?: Ariakit.MenuItemRadioProps[ 'hideOnClick' ];
	/**
	 * Determines if the element is disabled. This sets the `aria-disabled`
	 * attribute accordingly, enabling support for all elements, including those
	 * that don't support the native `disabled` attribute.
	 *
	 * @default false
	 */
	disabled?: Ariakit.MenuItemRadioProps[ 'disabled' ];
	/**
	 * Allows the component to be rendered as a different HTML element or React
	 * component. The value can be a React element or a function that takes in the
	 * original component props and gives back a React element with the props
	 * merged.
	 */
	render?: Ariakit.MenuItemRadioProps[ 'render' ];
	/**
	 * The radio item's name.
	 */
	name: Ariakit.MenuItemRadioProps[ 'name' ];
	/**
	 * The radio item's value.
	 */
	value: Ariakit.MenuItemRadioProps[ 'value' ];
	/**
	 * The controlled checked state of the radio menu item.
	 *
	 * Note: this prop will override the `defaultChecked` prop.
	 */
	checked?: Ariakit.MenuItemRadioProps[ 'checked' ];
	/**
	 * The checked state of the radio menu item when it is initially rendered.
	 * Use when not wanting to control its checked state.
	 *
	 * Note: this prop will be overriden by the `checked` prop, if it is defined.
	 */
	defaultChecked?: Ariakit.MenuItemRadioProps[ 'defaultChecked' ];
	/**
	 * A function that is called when the checkbox's checked state changes.
	 */
	onChange?: Ariakit.MenuItemRadioProps[ 'onChange' ];
}

export interface SeparatorProps {}
