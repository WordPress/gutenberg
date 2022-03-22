/**
 * External dependencies
 */
import { merge } from 'lodash';

/**
 * Internal dependencies
 */
import { rgba } from './colors';

export const BASE = {
	black: '#000',
	white: '#fff',
};

/**
 * TODO: Continue to update values as "G2" design evolves.
 *
 * "G2" refers to the movement to advance the interface of the block editor.
 * https://github.com/WordPress/gutenberg/issues/18667
 */
export const G2 = {
	blue: {
		medium: {
			focus: '#007cba',
			focusDark: '#fff',
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
	darkGray: {
		primary: '#1e1e1e',
		heading: '#050505',
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

export const DARK_GRAY = {
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

export const DARK_OPACITY = {
	900: rgba( '#000510', 0.9 ),
	800: rgba( '#00000a', 0.85 ),
	700: rgba( '#06060b', 0.8 ),
	600: rgba( '#000913', 0.75 ),
	500: rgba( '#0a1829', 0.7 ),
	400: rgba( '#0a1829', 0.65 ),
	300: rgba( '#0e1c2e', 0.62 ),
	200: rgba( '#162435', 0.55 ),
	100: rgba( '#223443', 0.5 ),
	backgroundFill: rgba( DARK_GRAY[ 700 ], 0.7 ),
};

export const DARK_OPACITY_LIGHT = {
	900: rgba( '#304455', 0.45 ),
	800: rgba( '#425863', 0.4 ),
	700: rgba( '#667886', 0.35 ),
	600: rgba( '#7b86a2', 0.3 ),
	500: rgba( '#9197a2', 0.25 ),
	400: rgba( '#95959c', 0.2 ),
	300: rgba( '#829493', 0.15 ),
	200: rgba( '#8b8b96', 0.1 ),
	100: rgba( '#747474', 0.05 ),
};

export const LIGHT_GRAY = {
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

export const LIGHT_OPACITY_LIGHT = {
	900: rgba( BASE.white, 0.5 ),
	800: rgba( BASE.white, 0.45 ),
	700: rgba( BASE.white, 0.4 ),
	600: rgba( BASE.white, 0.35 ),
	500: rgba( BASE.white, 0.3 ),
	400: rgba( BASE.white, 0.25 ),
	300: rgba( BASE.white, 0.2 ),
	200: rgba( BASE.white, 0.15 ),
	100: rgba( BASE.white, 0.1 ),
	backgroundFill: rgba( LIGHT_GRAY[ 300 ], 0.8 ),
};

// Additional colors.
// Some are from https://make.wordpress.org/design/handbook/foundations/colors/.

export const BLUE = {
	wordpress: {
		700: '#00669b',
	},
	dark: {
		900: '#0071a1',
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
		highlight: '#b3e7fe',
		focus: '#007cba',
	},
};

export const ALERT = {
	yellow: '#f0b849',
	red: '#d94f4f',
	green: '#4ab866',
};

export const ADMIN = {
	theme: `var( --wp-admin-theme-color, ${ BLUE.wordpress[ 700 ] })`,
	themeDark10: `var( --wp-admin-theme-color-darker-10, ${ BLUE.medium.focus })`,
};

// Namespaced values for raw colors hex codes.
export const UI = {
	theme: ADMIN.theme,
	background: BASE.white,
	backgroundDisabled: LIGHT_GRAY[ 200 ],
	border: G2.gray[ 700 ],
	borderHover: G2.gray[ 700 ],
	borderFocus: ADMIN.themeDark10,
	borderDisabled: G2.gray[ 400 ],
	borderLight: G2.gray[ 300 ],
	label: DARK_GRAY[ 500 ],
	textDisabled: DARK_GRAY[ 150 ],
	textDark: BASE.white,
	textLight: BASE.black,
};

export const COLORS = {
	...BASE,
	darkGray: merge( {}, DARK_GRAY, G2.darkGray ),
	darkOpacity: DARK_OPACITY,
	darkOpacityLight: DARK_OPACITY_LIGHT,
	mediumGray: G2.mediumGray,
	gray: G2.gray,
	lightGray: merge( {}, LIGHT_GRAY, G2.lightGray ),
	lightGrayLight: LIGHT_OPACITY_LIGHT,
	blue: merge( {}, BLUE, G2.blue ),
	alert: ALERT,
	admin: ADMIN,
	ui: UI,
};

export default COLORS;
