type AdminThemeColors = {
	primary: string;
	background: string;
};

const DEFAULT_THEME_COLORS: AdminThemeColors = {
	primary: '#3858e9',
	background: '#222524',
};

/*
 * Exported from this module only, not from the package, so tooling in this
 * repository can read the list of bundled schemes without duplicating it.
 */
export const ADMIN_THEME_COLORS = new Map< string, AdminThemeColors >( [
	[ 'modern', DEFAULT_THEME_COLORS ],
	[ 'fresh', { primary: '#0073ad', background: '#25292b' } ],
	[ 'midnight', { primary: '#c33f36', background: '#3d4042' } ],
	[ 'coffee', { primary: '#8e6544', background: '#5b534d' } ],
	[ 'ocean', { primary: '#537555', background: '#5f787f' } ],
	[ 'blue', { primary: '#3e719c', background: '#3876a8' } ],
	[ 'ectoplasm', { primary: '#646c3e', background: '#4f386e' } ],
	[ 'sunrise', { primary: '#a35d1c', background: '#cc4541' } ],
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
		'modern';

	return ADMIN_THEME_COLORS.get( scheme ) ?? DEFAULT_THEME_COLORS;
}
