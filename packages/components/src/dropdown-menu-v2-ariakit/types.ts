/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';

export interface DropdownMenuContext {
	store: Ariakit.MenuStore;
}

// TODO: add support for standard HTML props
export interface DropdownMenuProps {
	// TODO: do we need to support render props too?
	trigger: React.ReactElement;
	children?: React.ReactNode;
	modal?: boolean;
	className?: string;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: ( open: boolean ) => void;
}

export interface DropdownMenuGroupProps
	extends Omit< Ariakit.MenuGroupProps, 'store' > {}

export interface DropdownMenuGroupLabelProps
	extends Omit< Ariakit.MenuGroupLabelProps, 'store' > {}

export interface DropdownMenuItemProps {
	children: React.ReactNode;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
	onClick?: React.MouseEventHandler;
	hideOnClick?: boolean;
	disabled?: boolean;
}
