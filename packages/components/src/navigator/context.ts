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
};
export const NavigatorContext = createContext( initialContextValue );
