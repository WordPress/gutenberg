import { createContext, useContext } from '@wordpress/element';

type MenuContextValue = {
	isSubmenu: boolean;
};

const MenuContext = createContext< MenuContextValue >( {
	isSubmenu: false,
} );

const useMenuContext = () => useContext( MenuContext );

export { MenuContext, useMenuContext };
