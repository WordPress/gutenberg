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
	goTo: () => {},
	goBack: () => {},
	goToParent: () => {},
	addScreen: () => {},
	removeScreen: () => {},
	params: {},
	backToPreviousScreen: false,
};
export const NavigatorContext = createContext( initialContextValue );
