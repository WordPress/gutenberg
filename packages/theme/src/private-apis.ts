import warning from '@wordpress/warning';
import { lock } from './lock-unlock';
import { ThemeProvider } from './theme-provider';
import { useThemeProviderStyles } from './use-theme-provider-styles';

function warnPrivateApi( apiName: string, replacement?: string ) {
	const deletionMessage = replacement
		? 'this private export is scheduled for deletion'
		: 'This private export is scheduled for deletion';

	warning(
		`ThemeProvider: Accessing \`${ apiName }\` through \`@wordpress/theme\` private APIs is deprecated. ${
			replacement ? `${ replacement } ` : ''
		}${ deletionMessage } as \`@wordpress/theme\` approaches stabilization.`
	);
}

/**
 * @deprecated Private `@wordpress/theme` APIs are scheduled for deletion as the
 * package approaches stabilization. Import public APIs from `@wordpress/theme`
 * instead.
 */
export const privateApis = {};
lock( privateApis, {
	get ThemeProvider() {
		warnPrivateApi(
			'ThemeProvider',
			'Import `ThemeProvider` from `@wordpress/theme` instead;'
		);
		return ThemeProvider;
	},
	get useThemeProviderStyles() {
		warnPrivateApi( 'useThemeProviderStyles' );
		return useThemeProviderStyles;
	},
} );
