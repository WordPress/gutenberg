import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../lock-unlock';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const THEME_PRIMARY_COLORS = new Map< string, string >( [
	[ 'light', '#0085ba' ],
	[ 'modern', '#3858e9' ],
	[ 'blue', '#096484' ],
	[ 'coffee', '#46403c' ],
	[ 'ectoplasm', '#523f6d' ],
	[ 'midnight', '#e14d43' ],
	[ 'ocean', '#627c83' ],
	[ 'sunrise', '#dd823b' ],
] );

export function getAdminThemePrimaryColor(): string | undefined {
	const theme =
		document.body.className.match( /admin-color-([a-z]+)/ )?.[ 1 ];

	return theme && THEME_PRIMARY_COLORS.get( theme );
}

export function UserThemeProvider( {
	color,
	...restProps
}: React.ComponentProps< typeof ThemeProvider > ) {
	const primary = getAdminThemePrimaryColor();

	return <ThemeProvider { ...restProps } color={ { primary, ...color } } />;
}
