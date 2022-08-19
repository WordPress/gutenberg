/**
 * External dependencies
 */
import { merge } from 'lodash';

/**
 * Internal dependencies
 */
import { rgba } from './colors';

const BASE = {
	white: '#fff',
};

const G2 = {
	blue: {
		medium: {
			focus: '#007cba',
		},
	},
	gray: {
		900: '#1e1e1e',
		700: '#757575', // Meets 4.6:1 text contrast against white.
		600: '#949494', // Meets 3:1 UI or large text contrast against white.
		400: '#ccc',
		300: '#ddd', // Used for most borders.
		200: '#e0e0e0', // Used sparingly for light borders.
		100: '#f0f0f0', // Used for light gray backgrounds.
	},
	mediumGray: {
		text: '#757575',
	},
	lightGray: {
		ui: '#949494',
		secondary: '#ccc',
		tertiary: '#e7e8e9',
	},
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
	placeholder: rgba( G2.gray[ 900 ], 0.62 ),
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
	placeholder: rgba( BASE.white, 0.65 ),
};

// Additional colors.
// Some are from https://make.wordpress.org/design/handbook/foundations/colors/.

const BLUE = {
	wordpress: {
		700: '#00669b',
	},
	medium: {
		900: '#006589',
		800: '#00739c',
		700: '#007fac',
		600: '#008dbe',
		500: '#00a0d2',
		400: '#33b3db',
		300: '#66c6e4',
		200: '#bfe7f3',
		100: '#e5f5fa',
		focus: '#007cba',
	},
};

const ALERT = {
	yellow: '#f0b849',
	red: '#d94f4f',
	green: '#4ab866',
};

const ADMIN = {
	theme: `var( --wp-admin-theme-color, ${ BLUE.wordpress[ 700 ] })`,
	themeDark10: `var( --wp-admin-theme-color-darker-10, ${ BLUE.medium.focus })`,
};

// Namespaced values for raw colors hex codes.
const UI = {
	theme: ADMIN.theme,
	background: BASE.white,
	backgroundDisabled: LIGHT_GRAY[ 200 ],
	border: G2.gray[ 700 ],
	borderHover: G2.gray[ 700 ],
	borderFocus: ADMIN.themeDark10,
	borderDisabled: G2.gray[ 400 ],
	textDisabled: DARK_GRAY[ 150 ],
	textDark: BASE.white,
};

// Using Object.assign instead of { ...spread } syntax helps TypeScript
// to extract the correct type defs here.
export const COLORS = Object.assign( {}, BASE, {
	darkGray: DARK_GRAY,
	mediumGray: G2.mediumGray,
	/**
	 * The main gray color object (since Apr 16, 2022).
	 *
	 * We are in the process of simplifying the colors in this file,
	 * please prefer this `gray` object in the meantime.
	 */
	gray: G2.gray,
	lightGray: merge( {}, LIGHT_GRAY, G2.lightGray ),
	blue: merge( {}, BLUE, G2.blue ),
	alert: ALERT,
	admin: ADMIN,
	ui: UI,
} );

export default COLORS;
