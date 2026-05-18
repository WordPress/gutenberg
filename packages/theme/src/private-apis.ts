import { lock } from './lock-unlock';
import { ThemeProvider } from './theme-provider';
import { useThemeProviderStyles } from './use-theme-provider-styles';
import { UserThemeProvider } from './user-theme-provider';

export const privateApis = {};
lock( privateApis, {
	ThemeProvider,
	UserThemeProvider,
	useThemeProviderStyles,
} );
