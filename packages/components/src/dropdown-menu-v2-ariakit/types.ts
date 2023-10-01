/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';
import type { Placement } from '@floating-ui/react-dom';

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
	placement?: Placement;
	gutter?: number;
	shift?: number;
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
	// Default true
	hideOnClick?: boolean;
	disabled?: boolean;
}

export interface DropdownMenuCheckboxItemProps
	extends Omit< DropdownMenuItemProps, 'prefix' | 'hideOnClick' > {
	// Default false
	hideOnClick?: boolean;
	name: string;
	value: string;
	checked?: boolean;
	defaultChecked?: boolean;
	onChange?: ( event: React.ChangeEvent< HTMLInputElement > ) => void;
}

export interface DropdownMenuSeparatorProps
	extends Omit< Ariakit.MenuSeparatorProps, 'store' > {}
