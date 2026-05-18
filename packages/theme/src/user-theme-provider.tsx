import { ThemeProvider } from './theme-provider';
import type { ThemeProviderProps } from './types';

const ADMIN_THEME_PRIMARY_COLORS = new Map< string, string >( [
	[ 'light', '#0085ba' ],
	[ 'modern', '#3858e9' ],
	[ 'blue', '#096484' ],
	[ 'coffee', '#46403c' ],
	[ 'ectoplasm', '#523f6d' ],
	[ 'midnight', '#e14d43' ],
	[ 'ocean', '#627c83' ],
	[ 'sunrise', '#dd823b' ],
] );

const ADMIN_THEME_BACKGROUND_COLORS = new Map< string, string >( [
	[ 'fresh', '#1d2327' ],
	[ 'modern', '#1e1e1e' ],
	[ 'midnight', '#363b3f' ],
	[ 'coffee', '#59524c' ],
	[ 'ocean', '#738e96' ],
	[ 'blue', '#52accc' ],
	[ 'ectoplasm', '#523f6d' ],
	[ 'sunrise', '#cf4944' ],
	[ 'light', '#e5e5e5' ],
] );

export function UserThemeProvider( {
	color,
	...restProps
}: ThemeProviderProps ) {
	const scheme =
		document.body.className.match( /admin-color-([\w-]+)/ )?.[ 1 ];
	const primary = scheme
		? ADMIN_THEME_PRIMARY_COLORS.get( scheme )
		: undefined;
	const bg =
		( scheme && ADMIN_THEME_BACKGROUND_COLORS.get( scheme ) ) ||
		ADMIN_THEME_BACKGROUND_COLORS.get( 'fresh' );

	return (
		<ThemeProvider { ...restProps } color={ { primary, bg, ...color } } />
	);
}
