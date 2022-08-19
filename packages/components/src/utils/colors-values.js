/**
 * Internal dependencies
 */
import { rgba } from './colors';

const white = '#fff';

const GRAY = {
	900: '#1e1e1e',
	700: '#757575', // Meets 4.6:1 text contrast against white.
	600: '#949494', // Meets 3:1 UI or large text contrast against white.
	400: '#ccc',
	300: '#ddd', // Used for most borders.
	200: '#e0e0e0', // Used sparingly for light borders.
	100: '#f0f0f0', // Used for light gray backgrounds.
};

const DARK_GRAY = {
	900: '#191e23',
	800: '#23282d',
	700: '#32373c',
	600: '#40464d',
	500: '#555d66', // Use this most of the time for dark items.
	400: '#606a73',
	300: '#6c7781', // Lightest gray that can be used for AA text contrast.
	200: '#7e8993',
	150: '#8d96a0', // Lightest gray that can be used for AA non-text contrast.
	100: '#8f98a1',
	placeholder: rgba( GRAY[ 900 ], 0.62 ),
};

const LIGHT_GRAY = {
	900: '#a2aab2',
	800: '#b5bcc2',
	700: '#ccd0d4',
	600: '#d7dade',
	500: '#e2e4e7', // Good for "grayed" items and borders.
	400: '#e8eaeb', // Good for "readonly" input fields and special text selection.
	300: '#edeff0',
	200: '#f3f4f5',
	100: '#f8f9f9',
	placeholder: rgba( white, 0.65 ),
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
};

export const COLORS = {
	darkGray: DARK_GRAY,
	/**
	 * The main gray color object (since Apr 16, 2022).
	 *
	 * We are in the process of simplifying the colors in this file,
	 * please prefer this `gray` object in the meantime.
	 */
	gray: GRAY,
	lightGray: LIGHT_GRAY,
	white,
	alert: ALERT,
	ui: UI,
};

export default COLORS;
