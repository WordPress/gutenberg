/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from './constants';

export const NavigationContext = createContext( {
	activeItem: undefined,
	activeMenu: ROOT_MENU,
	setActiveMenu: noop,

	navigationTree: {
		items: {},
		addItem: noop,
		removeItem: noop,

		menus: {},
		addMenu: noop,
		removeMenu: noop,
	},
} );
export const useNavigationContext = () => useContext( NavigationContext );
