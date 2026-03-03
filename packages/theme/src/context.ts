/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ThemeProviderSettings } from './types';

interface ThemeContextType {
	resolvedSettings: ThemeProviderSettings;
}

export const ThemeContext = createContext< ThemeContextType >( {
	resolvedSettings: {
		color: {},
	},
} );
