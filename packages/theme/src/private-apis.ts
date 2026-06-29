import { lock } from './lock-unlock';
import { ThemeProvider } from './theme-provider';
import { useThemeProviderStyles } from './use-theme-provider-styles';

let hasWarnedThemeProviderPrivateApi = false;

function warnThemeProviderPrivateApi() {
	if (
		process.env.NODE_ENV === 'production' ||
		hasWarnedThemeProviderPrivateApi
	) {
		return;
	}

	hasWarnedThemeProviderPrivateApi = true;
	// eslint-disable-next-line no-console
	console.warn(
		'ThemeProvider: Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.'
	);
}

export const privateApis = {};
lock( privateApis, {
	get ThemeProvider() {
		warnThemeProviderPrivateApi();
		return ThemeProvider;
	},
	useThemeProviderStyles,
} );
