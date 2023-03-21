/**
 * Internal dependencies
 */
import { rgba } from './colors';

const white = '#fff';

// Matches the grays in @wordpress/base-styles
const GRAY = {
	900: '#1e1e1e',
	800: '#2f2f2f',
	/** Meets 4.6:1 text contrast against white. */
	700: '#757575',
	/** Meets 3:1 UI or large text contrast against white. */
	600: '#949494',
	400: '#ccc',
	/** Used for most borders. */
	300: '#ddd',
	/** Used sparingly for light borders. */
	200: '#e0e0e0',
	/** Used for light gray backgrounds. */
	100: '#f0f0f0',
};

// Matches @wordpress/base-styles
const ALERT = {
	yellow: '#f0b849',
	red: '#d94f4f',
	green: '#4ab866',
};

// Matches @wordpress/base-styles
const ADMIN = {
	theme: 'var(--wp-components-color-accent, var(--wp-admin-theme-color, #007cba))',
	themeDark10:
		'var(--wp-components-color-accent-darker-10, var(--wp-admin-theme-color-darker-10, #006ba1))',
};

const UI = {
	theme: ADMIN.theme,
	themeDark10: ADMIN.themeDark10,
	background: white,
	backgroundDisabled: GRAY[ 100 ],
	border: GRAY[ 600 ],
	borderHover: GRAY[ 700 ],
	borderFocus: ADMIN.themeDark10,
	borderDisabled: GRAY[ 400 ],
	textDisabled: GRAY[ 600 ],
	textDark: white,

	// Matches @wordpress/base-styles
	darkGrayPlaceholder: rgba( GRAY[ 900 ], 0.62 ),
	lightGrayPlaceholder: rgba( white, 0.65 ),
};

export const COLORS = Object.freeze( {
	/**
	 * The main gray color object.
	 */
	gray: GRAY,
	white,
	alert: ALERT,
	ui: UI,
} );

export default COLORS;
