/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { MenuContext as MenuContextType } from './types';

export const MenuContext = createContext< MenuContextType | undefined >(
	undefined
);
