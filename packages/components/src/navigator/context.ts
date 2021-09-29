/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NavigatorContext as NavigatorContextType } from './types';

// Should it have more opinionated defaults?
const initialContextValue: NavigatorContextType = [ {}, () => {} ];
export const NavigatorContext = createContext( initialContextValue );
