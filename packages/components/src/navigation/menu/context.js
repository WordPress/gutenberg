/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const NavigationMenuContext = createContext( {
	menu: undefined,
	search: '',
} );
export const useNavigationMenuContext = () =>
	useContext( NavigationMenuContext );
