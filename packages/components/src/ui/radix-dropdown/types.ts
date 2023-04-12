/**
 * External dependencies
 */
import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

/**
 * Internal dependencies
 */
import type { IconType } from '../../icon';

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

export type DropdownItemProps = DropdownMenuPrimitive.DropdownMenuItemProps & {
	icon?: IconType;
};
