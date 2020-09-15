/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const NavigationMenuContext = createContext( {
	menu: undefined,
} );
export const useNavigationMenuContext = () =>
	useContext( NavigationMenuContext );
