import deprecated from '@wordpress/deprecated';
import { lock } from './lock-unlock';
import { ThemeProvider } from './theme-provider';
import { useThemeProviderStyles } from './use-theme-provider-styles';

function warnPrivateApi(
	apiName: string,
	options: { alternative?: string; hint?: string } = {}
) {
	deprecated( `\`privateApis.${ apiName }\` from \`@wordpress/theme\``, {
		since: '7.1',
		version: '7.3',
		...options,
	} );
}

/**
 * @deprecated Private `@wordpress/theme` APIs will be removed in WordPress 7.3.
 * Use public `@wordpress/theme` APIs for supported theming use cases.
 */
export const privateApis = {};
lock( privateApis, {
	get ThemeProvider() {
		warnPrivateApi( 'ThemeProvider', {
			alternative: '`ThemeProvider` from `@wordpress/theme`',
		} );
		return ThemeProvider;
	},
	get useThemeProviderStyles() {
		warnPrivateApi( 'useThemeProviderStyles', {
			alternative:
				'`ThemeProvider` from `@wordpress/theme` for supported theming use cases',
			hint: '`useThemeProviderStyles` has no public replacement.',
		} );
		return useThemeProviderStyles;
	},
} );
