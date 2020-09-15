/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const NavigationMenuContext = createContext( {
	menu: undefined,
	isActive: false,
} );
export const useNavigationMenuContext = () =>
	useContext( NavigationMenuContext );
