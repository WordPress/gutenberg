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
	 * @default 'center'
	 */
	align?: DropdownMenuPrimitive.DropdownMenuContentProps[ 'align' ];
	/**
	 * An offset in pixels from the "start" or "end" alignment options.
	 *
	 * @default 0
	 */
	alignOffset?: DropdownMenuPrimitive.DropdownMenuContentProps[ 'alignOffset' ];

	/**
	 * The contents rendered inside the trigger
	 */
	trigger: React.ReactNode;
	/**
	 * The contents of the dropdown
	 */
	children: React.ReactNode;
};

export type DropdownSubMenuProps = {
	subProps?: Omit< DropdownMenuPrimitive.DropdownMenuSubProps, 'children' >;
	subContentProps?: Omit<
		DropdownMenuPrimitive.DropdownMenuSubContentProps,
		'children'
	>;
	portalProps?: Omit<
		DropdownMenuPrimitive.DropdownMenuPortalProps,
		'children'
	>;
	triggerProps?: Omit<
		DropdownMenuPrimitive.DropdownMenuSubTriggerProps,
		'children'
	>;
	trigger: React.ReactNode;
	children: React.ReactNode;
};

export type DropdownItemProps = {
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
