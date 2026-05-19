type AdminThemeColors = {
	primary: string;
	bg: string;
};

const ADMIN_THEME_COLORS = new Map< string, AdminThemeColors >( [
	[ 'fresh', { primary: '#3858e9', bg: '#1e1e1e' } ],
	[ 'modern', { primary: '#3858e9', bg: '#1e1e1e' } ],
	[ 'midnight', { primary: '#e14d43', bg: '#363b3f' } ],
	[ 'coffee', { primary: '#46403c', bg: '#7c726c' } ],
	[ 'ocean', { primary: '#627c83', bg: '#5f787f' } ],
	[ 'blue', { primary: '#096484', bg: '#0e7da4' } ],
	[ 'ectoplasm', { primary: '#523f6d', bg: '#8468ab' } ],
	[ 'sunrise', { primary: '#dd823b', bg: '#cc4541' } ],
	[ 'light', { primary: '#0085ba', bg: '#e5e5e5' } ],
] );

/**
 * Reads the active WordPress admin color scheme from the `admin-color-*` body
 * class and returns its primary and background colors. Intended to seed a
 * `ThemeProvider` (`color` prop) so the design system matches the user's chosen
 * admin color scheme.
 *
 * @return The primary and background colors for the active admin color scheme.
 */
export function getAdminThemeColors(): AdminThemeColors | undefined {
	const scheme =
		document.body.className.match( /admin-color-([\w-]+)/ )?.[ 1 ] ??
		'fresh';

	return (
		ADMIN_THEME_COLORS.get( scheme ) ?? ADMIN_THEME_COLORS.get( 'fresh' )
	);
}
