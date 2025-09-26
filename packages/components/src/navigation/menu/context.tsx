/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NavigationMenuContext as NavigationMenuContextType } from '../types';

export const NavigationMenuContext = createContext< NavigationMenuContextType >(
	{
		menu: undefined,
		search: '',
	}
);
NavigationMenuContext.displayName = 'NavigationMenuContext';

export const useNavigationMenuContext = () =>
	useContext( NavigationMenuContext );
