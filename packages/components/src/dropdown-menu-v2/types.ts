/**
 * External dependencies
 */
import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

export type DropdownMenuProps = {
	/**
	 * The open state of the dropdown menu when it is initially rendered. Use when
	 * you do not need to control its open state.
	 *
	 */
	defaultOpen?: DropdownMenuPrimitive.DropdownMenuProps[ 'defaultOpen' ];
	/**
	 * The controlled open state of the dropdown menu. Must be used in conjunction
	 * with `onOpenChange`.
	 */
	open?: DropdownMenuPrimitive.DropdownMenuProps[ 'open' ];
	/**
	 * Event handler called when the open state of the dropdown menu changes.
	 */
	onOpenChange?: DropdownMenuPrimitive.DropdownMenuProps[ 'onOpenChange' ];
	/**
	 * The modality of the dropdown menu. When set to true, interaction with
	 * outside elements will be disabled and only menu content will be visible to
	 * screen readers.
	 *
	 * @default true
	 */
	modal?: DropdownMenuPrimitive.DropdownMenuProps[ 'modal' ];
	/**
	 * The preferred side of the trigger to render against when open.
	 * Will be reversed when collisions occur and avoidCollisions is enabled.
	 *
	 * @default 'bottom'
	 */
	side?: DropdownMenuPrimitive.DropdownMenuContentProps[ 'side' ];
	/**
	 * The distance in pixels from the trigger.
	 *
	 * @default 0
	 */
	sideOffset?: DropdownMenuPrimitive.DropdownMenuContentProps[ 'sideOffset' ];
	/**
	 * The preferred alignment against the trigger.
	 * May change when collisions occur.
	 *
	 * @default 'start'
	 */
	align?: DropdownMenuPrimitive.DropdownMenuContentProps[ 'align' ];
	/**
	 * An offset in pixels from the "start" or "end" alignment options.
	 *
	 * @default 0
	 */
	alignOffset?: DropdownMenuPrimitive.DropdownMenuContentProps[ 'alignOffset' ];
	/**
	 * The trigger button.
	 */
	trigger: React.ReactNode;
	/**
	 * The contents of the dropdown
	 */
	children: React.ReactNode;
};

export type DropdownSubMenuTriggerProps = {
	/**
	 * The contents of the item.
	 */
	children: React.ReactNode;
	/**
	 * The contents of the item's prefix.
	 */
	prefix?: React.ReactNode;
	/**
	 * The contents of the item's suffix.
	 *
	 * @default The standard chevron icon for a submenu trigger.
	 */
	suffix?: React.ReactNode;
};

export type DropdownSubMenuProps = {
	/**
	 * The open state of the submenu when it is initially rendered. Use when you
	 * do not need to control its open state.
	 */
	defaultOpen?: DropdownMenuPrimitive.DropdownMenuSubProps[ 'defaultOpen' ];
	/**
	 * The controlled open state of the submenu. Must be used in conjunction with
	 * `onOpenChange`.
	 */
	open?: DropdownMenuPrimitive.DropdownMenuSubProps[ 'open' ];
	/**
	 * Event handler called when the open state of the submenu changes.
	 */
	onOpenChange?: DropdownMenuPrimitive.DropdownMenuSubProps[ 'onOpenChange' ];
	/**
	 * When `true`, prevents the user from interacting with the item.
	 */
	disabled?: DropdownMenuPrimitive.DropdownMenuSubTriggerProps[ 'disabled' ];
	/**
	 * Optional text used for typeahead purposes for the trigger. By default the typeahead
	 * behavior will use the `.textContent` of the trigger. Use this when the content
	 * is complex, or you have non-textual content inside.
	 */
	textValue?: DropdownMenuPrimitive.DropdownMenuSubTriggerProps[ 'textValue' ];
	/**
	 * The contents rendered inside the trigger. The trigger should be
	 * an instance of the `DropdownSubMenuTriggerProps` component.
	 */
	trigger: React.ReactNode;
	/**
	 * The contents of the dropdown sub menu
	 */
	children: React.ReactNode;
};

export type DropdownMenuItemProps = {
	/**
	 * When true, prevents the user from interacting with the item.
	 *
	 * @default false
	 */
	disabled?: DropdownMenuPrimitive.DropdownMenuItemProps[ 'disabled' ];
	/**
	 * Event handler called when the user selects an item (via mouse or keyboard).
	 * Calling `event.preventDefault` in this handler will prevent the dropdown
	 * menu from closing when selecting that item.
	 */
	onSelect?: DropdownMenuPrimitive.DropdownMenuItemProps[ 'onSelect' ];
	/**
	 * Optional text used for typeahead purposes. By default the typeahead
	 * behavior will use the `.textContent` of the item. Use this when the content
	 * is complex, or you have non-textual content inside.
	 */
	textValue?: DropdownMenuPrimitive.DropdownMenuItemProps[ 'textValue' ];
	/**
	 * The contents of the item
	 */
	children: React.ReactNode;
	/**
	 * The contents of the item's prefix
	 */
	prefix?: React.ReactNode;
	/**
	 * The contents of the item's suffix
	 */
	suffix?: React.ReactNode;
};

export type DropdownMenuCheckboxItemProps = {
	/**
	 * The controlled checked state of the item.
	 * Must be used in conjunction with `onCheckedChange`.
	 *
	 * @default false
	 */
	checked?: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps[ 'checked' ];
	/**
	 * Event handler called when the checked state changes.
	 */
	onCheckedChange?: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps[ 'onCheckedChange' ];
	/**
	 * When `true`, prevents the user from interacting with the item.
	 */
	disabled?: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps[ 'disabled' ];
	/**
	 * Event handler called when the user selects an item (via mouse or keyboard).
	 * Calling `event.preventDefault` in this handler will prevent the dropdown
	 * 	menu from closing when selecting that item.
	 */
	onSelect?: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps[ 'onSelect' ];
	/**
	 * Optional text used for typeahead purposes. By default the typeahead
	 * behavior will use the `.textContent` of the item. Use this when the content
	 * is complex, or you have non-textual content inside.
	 */
	textValue?: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps[ 'textValue' ];
	/**
	 * The contents of the checkbox item
	 */
	children: React.ReactNode;
	/**
	 * The contents of the checkbox item's suffix
	 */
	suffix?: React.ReactNode;
};

export type DropdownMenuRadioGroupProps = {
	/**
	 * The value of the selected item in the group.
	 */
	value?: DropdownMenuPrimitive.DropdownMenuRadioGroupProps[ 'value' ];
	/**
	 * Event handler called when the value changes.
	 */
	onValueChange?: DropdownMenuPrimitive.DropdownMenuRadioGroupProps[ 'onValueChange' ];
	/**
	 * The contents of the radio group
	 */
	children: React.ReactNode;
};

export type DropdownMenuRadioItemProps = {
	/**
	 * The unique value of the item.
	 */
	value: DropdownMenuPrimitive.DropdownMenuRadioItemProps[ 'value' ];
	/**
	 * When `true`, prevents the user from interacting with the item.
	 */
	disabled?: DropdownMenuPrimitive.DropdownMenuRadioItemProps[ 'disabled' ];
	/**
	 * Event handler called when the user selects an item (via mouse or keyboard).
	 * Calling `event.preventDefault` in this handler will prevent the dropdown
	 * menu from closing when selecting that item.
	 */
	onSelect?: DropdownMenuPrimitive.DropdownMenuRadioItemProps[ 'onSelect' ];
	/**
	 * Optional text used for typeahead purposes. By default the typeahead
	 * behavior will use the `.textContent` of the item. Use this when the content
	 * is complex, or you have non-textual content inside.
	 */
	textValue?: DropdownMenuPrimitive.DropdownMenuRadioItemProps[ 'textValue' ];
	/**
	 * The contents of the radio item
	 */
	children: React.ReactNode;
	/**
	 * The contents of the radio item's suffix
	 */
	suffix?: React.ReactNode;
};

export type DropdownMenuLabelProps = {
	/**
	 * The contents of the label
	 */
	children: React.ReactNode;
};

export type DropdownMenuGroupProps = {
	/**
	 * The contents of the group
	 */
	children: React.ReactNode;
};

export type DropdownMenuSeparatorProps = {};

export type DropdownMenuInternalContext = {
	/**
	 * This variant can be used to change the appearance of the component in
	 * specific contexts, ie. when rendered inside the `Toolbar` component.
	 */
	variant?: 'toolbar';
};

export type DropdownMenuPrivateContext = Pick<
	DropdownMenuInternalContext,
	'variant'
> & {
	portalContainer: HTMLElement | null;
};
