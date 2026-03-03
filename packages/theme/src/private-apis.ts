/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { ThemeProvider } from './theme-provider';
import { useThemeProviderStyles } from './use-theme-provider-styles';

export const privateApis = {};
lock( privateApis, {
	ThemeProvider,
	useThemeProviderStyles,
} );
