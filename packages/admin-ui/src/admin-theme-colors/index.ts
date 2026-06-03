type AdminThemeColors = {
	primary: string;
	bg: string;
};

const DEFAULT_THEME_COLORS: AdminThemeColors = {
	primary: '#3858e9',
	bg: '#25292b',
};

const ADMIN_THEME_COLORS = new Map< string, AdminThemeColors >( [
	[ 'fresh', DEFAULT_THEME_COLORS ],
	[ 'modern', { primary: '#3858e9', bg: '#222524' } ],
	[ 'midnight', { primary: '#cf4339', bg: '#3d4042' } ],
	[ 'coffee', { primary: '#916745', bg: '#5b534d' } ],
	[ 'ocean', { primary: '#567958', bg: '#5f787f' } ],
	[ 'blue', { primary: '#437aa8', bg: '#3876a8' } ],
	[ 'ectoplasm', { primary: '#646c3e', bg: '#4f386e' } ],
	[ 'sunrise', { primary: '#ad631e', bg: '#cc4541' } ],
	[ 'light', { primary: '#007cba', bg: '#eaeeed' } ],
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
