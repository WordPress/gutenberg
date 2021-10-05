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
	setLocation: () => {},
	isAnimating: false,
	setIsAnimating: () => {},
};
export const NavigatorContext = createContext( initialContextValue );
