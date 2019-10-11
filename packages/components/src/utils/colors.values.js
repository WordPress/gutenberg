/**
 * Internal dependencies
 */
import { rgba } from './colors';
export const BASE = {
	black: '#000',
	white: '#fff',
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

export const COLORS = {
	...BASE,
	darkGrey: DARK_GRAY,
	darkOpacity: DARK_OPACITY,
	darkOpacityLight: DARK_OPACITY_LIGHT,
	lightGray: LIGHT_GRAY,
	lightGrayLight: LIGHT_OPACITY_LIGHT,
	blue: BLUE,
	alert: ALERT,
};

export default COLORS;
