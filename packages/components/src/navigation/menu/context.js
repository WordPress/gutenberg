/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const NavigationMenuContext = createContext( {
	isActive: false,
	menu: undefined,
	search: '',
} );
export const useNavigationMenuContext = () =>
	useContext( NavigationMenuContext );
