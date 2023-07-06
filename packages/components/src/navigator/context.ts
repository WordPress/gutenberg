/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NavigatorContext as NavigatorContextType } from './types';

const initialContextValue: NavigatorContextType = {
	location: {},
	params: {},
	hasBack: false,
	goTo: () => {},
	goBack: () => {},
	goToParent: () => {},
	addScreen: () => {},
	removeScreen: () => {},
};
export const NavigatorContext = createContext( initialContextValue );
