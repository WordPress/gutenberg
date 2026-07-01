type AdminThemeColors = {
	primary: string;
	background: string;
};

const DEFAULT_THEME_COLORS: AdminThemeColors = {
	primary: '#3858e9',
	background: '#25292b',
};

const ADMIN_THEME_COLORS = new Map< string, AdminThemeColors >( [
	[ 'fresh', DEFAULT_THEME_COLORS ],
	[ 'modern', { primary: '#3858e9', background: '#222524' } ],
	[ 'midnight', { primary: '#cf4339', background: '#3d4042' } ],
	[ 'coffee', { primary: '#916745', background: '#5b534d' } ],
	[ 'ocean', { primary: '#567958', background: '#5f787f' } ],
	[ 'blue', { primary: '#437aa8', background: '#3876a8' } ],
	[ 'ectoplasm', { primary: '#646c3e', background: '#4f386e' } ],
	[ 'sunrise', { primary: '#ad631e', background: '#cc4541' } ],
	[ 'light', { primary: '#007cba', background: '#eaeeed' } ],
] );

/**
 * Reads the active WordPress admin color scheme from the `admin-color-*` body
 * class and returns its primary and background colors. Intended to seed a
 * `ThemeProvider` (`color` prop) so the design system matches the user's chosen
 * admin color scheme.
 *
 * @return The primary and background colors for the active admin color scheme.
 */
export function getAdminThemeColors(): AdminThemeColors {
	const scheme =
		document.body.className.match( /admin-color-([\w-]+)/ )?.[ 1 ] ??
		'fresh';

	return ADMIN_THEME_COLORS.get( scheme ) ?? DEFAULT_THEME_COLORS;
}
