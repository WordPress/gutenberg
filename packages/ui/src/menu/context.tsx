import { createContext, useContext } from '@wordpress/element';
import type { ReactNode, RefObject } from 'react';

type MenuContextValue = {
	isSubmenu: boolean;
	submenuTriggerRef?: RefObject< HTMLDivElement >;
};

const MenuContext = createContext< MenuContextValue >( {
	isSubmenu: false,
} );

const useMenuContext = () => useContext( MenuContext );

const MenuGroupContext = createContext< 'group' | 'radio-group' | null >(
	null
);

const useMenuGroupContext = () => useContext( MenuGroupContext );

type MenuItemContentContextValue = {
	labelId?: string;
	labelTrailing?: ReactNode;
};

const MenuItemContentContext =
	createContext< MenuItemContentContextValue | null >( null );

const useMenuItemContentContext = () => useContext( MenuItemContentContext );

export {
	MenuContext,
	MenuGroupContext,
	MenuItemContentContext,
	useMenuContext,
	useMenuGroupContext,
	useMenuItemContentContext,
};
