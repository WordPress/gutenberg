/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const NavigationListViewContext = createContext( {
	currentMenuId: null,
	createNavigationMenuIsSuccess: false,
	createNavigationMenuIsError: false,
	onCreateNew: () => {},
	onSelectClassicMenu: () => {},
	onSelectNavigationMenu: () => {},
	blockEditingMode: 'default',
} );

export const NavigationListViewProvider = NavigationListViewContext.Provider;

export function useNavigationListViewContext() {
	return useContext( NavigationListViewContext );
}
