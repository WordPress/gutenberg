/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';
import type { Placement } from '@floating-ui/react-dom';

export interface DropdownMenuContext {
	/**
	 * The ariakit store shared across all DropdownMenu subcomponents.
	 */
	store: Ariakit.MenuStore;
	/**
	 * The variant used by the underlying menu popover.
	 */
	variant?: 'toolbar';
}

export interface DropdownMenuProps {
	/**
	 * The trigger button.
	 */
	trigger: React.ReactElement;
	/**
	 * The contents of the dropdown.
	 */
	children?: React.ReactNode;
	/**
	 * The open state of the dropdown menu when it is initially rendered. Use when
	 * not wanting to control its open state.
	 *
	 * @default false
	 */
	defaultOpen?: boolean;
	/**
	 * The controlled open state of the dropdown menu. Must be used in conjunction
	 * with `onOpenChange`.
	 */
	open?: boolean;
	/**
	 * Event handler called when the open state of the dropdown menu changes.
	 */
	onOpenChange?: ( open: boolean ) => void;
	/**
	 * The modality of the dropdown menu. When set to true, interaction with
	 * outside elements will be disabled and only menu content will be visible to
	 * screen readers.
	 *
	 * @default true
	 */
	modal?: boolean;
	/**
	 * The placement of the dropdown menu popover.
	 *
	 * @default 'bottom-start' for root-level menus, 'right-start' for nested menus
	 */
	placement?: Placement;
	/**
	 * The distance between the popover and the anchor element.
	 *
	 * @default 8 for root-level menus, 16 for nested menus
	 */
	gutter?: number;
	/**
	 * The skidding of the popover along the anchor element. Can be set to
	 * negative values to make the popover shift to the opposite side.
	 *
	 * @default 0 for root-level menus, -8 for nested menus
	 */
	shift?: number;
	/**
	 * Determines whether the menu popover will be hidden when the user presses
	 * the Escape key.
	 *
	 * @default `( event ) => { event.preventDefault(); return true; }`
	 */
	hideOnEscape?:
		| boolean
		| ( (
				event: KeyboardEvent | React.KeyboardEvent< Element >
		  ) => boolean );
}

export interface DropdownMenuGroupProps {
	/**
	 * The contents of the dropdown menu group.
	 */
	children: React.ReactNode;
}

export interface DropdownMenuItemProps {
	/**
	 * The contents of the menu item.
	 */
	children: React.ReactNode;
	/**
	 * The contents of the menu item's prefix.
	 */
	prefix?: React.ReactNode;
	/**
	 * The contents of the menu item's suffix.
	 */
	suffix?: React.ReactNode;
	/**
	 * Whether to hide the parent menu when the item is clicked.
	 *
	 * @default true
	 */
	hideOnClick?: boolean;
	/**
	 * Determines if the element is disabled.
	 */
	disabled?: boolean;
}

export interface DropdownMenuCheckboxItemProps
	extends Omit< DropdownMenuItemProps, 'prefix' | 'hideOnClick' > {
	/**
	 * Whether to hide the dropdown menu when the item is clicked.
	 *
	 * @default false
	 */
	hideOnClick?: boolean;
	/**
	 * The checkbox menu item's name.
	 */
	name: string;
	/**
	 * The checkbox item's value, useful when using multiple checkbox menu items
	 * associated to the same `name`.
	 */
	value?: string;
	/**
	 * The controlled checked state of the checkbox menu item.
	 */
	checked?: boolean;
	/**
	 * The checked state of the checkbox menu item when it is initially rendered.
	 * Use when not wanting to control its checked state.
	 */
	defaultChecked?: boolean;
	/**
	 * Event handler called when the checked state of the checkbox menu item changes.
	 */
	onChange?: ( event: React.ChangeEvent< HTMLInputElement > ) => void;
}

export interface DropdownMenuRadioItemProps
	extends Omit< DropdownMenuItemProps, 'prefix' | 'hideOnClick' > {
	/**
	 * Whether to hide the dropdown menu when the item is clicked.
	 *
	 * @default false
	 */
	hideOnClick?: boolean;
	/**
	 * The radio item's name.
	 */
	name: string;
	/**
	 * The radio item's value.
	 */
	value: string | number;
	/**
	 * The controlled checked state of the radio menu item.
	 */
	checked?: boolean;
	/**
	 * The checked state of the radio menu item when it is initially rendered.
	 * Use when not wanting to control its checked state.
	 */
	defaultChecked?: boolean;
	/**
	 * Event handler called when the checked radio menu item changes.
	 */
	onChange?: ( event: React.ChangeEvent< HTMLInputElement > ) => void;
}

export interface DropdownMenuSeparatorProps {}
