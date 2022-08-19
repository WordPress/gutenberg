/**
 * Internal dependencies
 */
import { rgba } from './colors';

const white = '#fff';

// Matches the grays in @wordpress/base-styles _colors.scss
const GRAY = {
	900: '#1e1e1e',
	800: '#2f2f2f',
	700: '#757575', // Meets 4.6:1 text contrast against white.
	600: '#949494', // Meets 3:1 UI or large text contrast against white.
	400: '#ccc',
	300: '#ddd', // Used for most borders.
	200: '#e0e0e0', // Used sparingly for light borders.
	100: '#f0f0f0', // Used for light gray backgrounds.
};

const DARK_GRAY = {
	500: '#555d66', // Use this most of the time for dark items.
	300: '#6c7781', // Lightest gray that can be used for AA text contrast.
	150: '#8d96a0', // Lightest gray that can be used for AA non-text contrast.
};

const LIGHT_GRAY = {
	800: '#b5bcc2',
	600: '#d7dade',
	400: '#e8eaeb', // Good for "readonly" input fields and special text selection.
	300: '#edeff0',
	200: '#f3f4f5',
};

// Additional colors.
// Some are from https://make.wordpress.org/design/handbook/foundations/colors/.

const ALERT = {
	yellow: '#f0b849',
	red: '#d94f4f',
	green: '#4ab866',
};

const ADMIN = {
	theme: 'var( --wp-admin-theme-color, #007cba)',
	themeDark10: 'var( --wp-admin-theme-color-darker-10, #006ba1)',
};

// Namespaced values for raw colors hex codes.
const UI = {
	theme: ADMIN.theme,
	background: white,
	backgroundDisabled: LIGHT_GRAY[ 200 ],
	border: GRAY[ 700 ],
	borderHover: GRAY[ 700 ],
	borderFocus: ADMIN.themeDark10,
	borderDisabled: GRAY[ 400 ],
	textDisabled: DARK_GRAY[ 150 ],
	textDark: white,

	// Matches @wordpress/base-styles
	darkGrayPlaceholder: rgba( GRAY[ 900 ], 0.62 ),
	lightGrayPlaceholder: rgba( white, 0.65 ),
};

export const COLORS = {
	/**
	 * @deprecated Try to use `gray` instead.
	 */
	darkGray: DARK_GRAY,
	/**
	 * The main gray color object.
	 */
	gray: GRAY,
	/**
	 * @deprecated Try to use `gray` instead.
	 */
	lightGray: LIGHT_GRAY,
	white,
	alert: ALERT,
	ui: UI,
};

export default COLORS;
