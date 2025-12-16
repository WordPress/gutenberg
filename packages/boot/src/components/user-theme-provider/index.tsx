import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../lock-unlock';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

export function getAdminThemePrimaryColor(): string | undefined {
	const theme =
		document.body.className.match( /admin-color-([a-z]+)/ )?.[ 1 ];

	switch ( theme ) {
		case 'light':
			return '#0085ba';
		case 'modern':
			return '#3858e9';
		case 'blue':
			return '#096484';
		case 'coffee':
			return '#46403c';
		case 'ectoplasm':
			return '#523f6d';
		case 'midnight':
			return '#e14d43';
		case 'ocean':
			return '#627c83';
		case 'sunrise':
			return '#dd823b';
	}

	return undefined;
}

export function UserThemeProvider( {
	color,
	...restProps
}: React.ComponentProps< typeof ThemeProvider > ) {
	const primary = getAdminThemePrimaryColor();

	return <ThemeProvider { ...restProps } color={ { primary, ...color } } />;
}
