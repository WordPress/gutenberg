// eslint-disable-next-line no-restricted-imports -- Temporary compatibility fallback for older @wordpress/theme runtimes. Remove in WordPress 7.3.
import * as theme from '@wordpress/theme';
import { unlock } from '../lock-unlock';

type ThemeProviderComponent = typeof theme.ThemeProvider;
type ThemePackageWithCompatibilityFallback = Omit<
	typeof theme,
	'ThemeProvider' | 'privateApis'
> & {
	ThemeProvider?: ThemeProviderComponent;
	privateApis?: unknown;
};

function getThemeProvider(): ThemeProviderComponent {
	const themePackage = theme as ThemePackageWithCompatibilityFallback;

	if ( themePackage.ThemeProvider ) {
		return themePackage.ThemeProvider;
	}

	if ( ! themePackage.privateApis ) {
		throw new Error(
			'@wordpress/ui: @wordpress/theme must expose `ThemeProvider` or `privateApis.ThemeProvider`.'
		);
	}

	// TODO: Remove this fallback when @wordpress/theme private APIs are removed in WordPress 7.3.
	return unlock< { ThemeProvider: ThemeProviderComponent } >(
		themePackage.privateApis
	).ThemeProvider;
}

export const ThemeProvider: ThemeProviderComponent = getThemeProvider();
