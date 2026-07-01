import { createContext } from '@wordpress/element';
import type { ThemeProviderSettings } from './types';

interface ThemeContextType {
	resolvedSettings: ThemeProviderSettings;
	hasCustomPrimary: boolean;
}

export const ThemeContext = createContext< ThemeContextType >( {
	resolvedSettings: {
		color: {},
		cursor: undefined,
		cornerRadius: undefined,
	},
	hasCustomPrimary: false,
} );
