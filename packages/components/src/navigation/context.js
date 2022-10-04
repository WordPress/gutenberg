/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from './constants';

const noop = () => {};

export const NavigationContext = createContext( {
	activeItem: undefined,
	activeMenu: ROOT_MENU,
	setActiveMenu: noop,
	isMenuEmpty: noop,

	navigationTree: {
		items: {},
		getItem: noop,
		addItem: noop,
		removeItem: noop,

		menus: {},
		getMenu: noop,
		addMenu: noop,
		removeMenu: noop,
		childMenu: {},
		traverseMenu: noop,
		isMenuEmpty: noop,
	},
} );
export const useNavigationContext = () => useContext( NavigationContext );
