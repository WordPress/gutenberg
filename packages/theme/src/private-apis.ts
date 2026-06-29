import deprecated from '@wordpress/deprecated';
import { lock } from './lock-unlock';
import { ThemeProvider } from './theme-provider';
import { useThemeProviderStyles } from './use-theme-provider-styles';

function warnPrivateApi( apiName: string ) {
	deprecated( `\`privateApis.${ apiName }\` from \`@wordpress/theme\``, {
		since: '7.1',
		version: '7.2',
		alternative: '`ThemeProvider` from `@wordpress/theme`',
	} );
}

/**
 * @deprecated Private `@wordpress/theme` APIs will be removed in WordPress 7.2.
 * Import `ThemeProvider` from `@wordpress/theme` instead.
 */
export const privateApis = {};
lock( privateApis, {
	get ThemeProvider() {
		warnPrivateApi( 'ThemeProvider' );
		return ThemeProvider;
	},
	get useThemeProviderStyles() {
		warnPrivateApi( 'useThemeProviderStyles' );
		return useThemeProviderStyles;
	},
} );
