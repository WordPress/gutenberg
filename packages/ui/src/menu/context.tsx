import { createContext, useContext } from '@wordpress/element';

type MenuContextValue = {
	isSubmenu: boolean;
};

const MenuContext = createContext< MenuContextValue >( {
	isSubmenu: false,
} );

const useMenuContext = () => useContext( MenuContext );

type MenuItemContentContextValue = {
	labelId: string;
	descriptionId: string;
};

const MenuItemContentContext =
	createContext< MenuItemContentContextValue | null >( null );

const useMenuItemContentContext = () => useContext( MenuItemContentContext );

export {
	MenuContext,
	MenuItemContentContext,
	useMenuContext,
	useMenuItemContentContext,
};
