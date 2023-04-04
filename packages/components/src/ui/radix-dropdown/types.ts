/**
 * External dependencies
 */
import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

export type DropdownMenuProps = {
	/**
	 * The props passed to the dropdown's root element
	 */
	rootProps?: Omit< DropdownMenuPrimitive.DropdownMenuProps, 'children' >;
	/**
	 * The props passed to the dropdown's content
	 */
	contentProps?: Omit<
		DropdownMenuPrimitive.DropdownMenuContentProps,
		'children'
	>;
	portalProps?: Omit<
		DropdownMenuPrimitive.DropdownMenuPortalProps,
		'children'
	>;
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
