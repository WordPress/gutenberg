import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
// eslint-disable-next-line no-restricted-imports -- Temporary compatibility fallback for older @wordpress/theme runtimes. Remove in WordPress 7.3.
import * as theme from '@wordpress/theme';

type ThemeProviderComponent = typeof theme.ThemeProvider;
type ThemePackageWithCompatibilityFallback = Omit<
	typeof theme,
	'ThemeProvider' | 'privateApis'
> & {
	ThemeProvider?: ThemeProviderComponent;
	privateApis?: unknown;
};

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/ui'
);

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
