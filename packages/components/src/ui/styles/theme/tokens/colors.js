/**
 * Internal dependencies
 */
import { get } from '../../../create-styles';
import { createRgbaColors, createTextColors } from '../utils';

export const CORE_PURPLE_COLORS = {
	purple100: '#f3f1f8',
	purple300: '#B4A8D2',
	purple500: '#826eb4',
	purple700: '#4e426c',
	purple900: '#342c48',
};

export const CORE_DARK_GRAY_COLORS = {
	darkGray100: '#8F98A1',
	darkGray300: '#6C7781',
	darkGray500: '#555D66',
	darkGray700: '#32373C',
	darkGray900: '#191E23',
};

export const CORE_LIGHT_GRAY_COLORS = {
	lightGray100: '#fbfbfc',
	lightGray300: '#edeff0',
	lightGray500: '#e2e4e7',
	lightGray700: '#ccd0d4',
	lightGray900: '#a2aab2',
};

export const CORE_RED_COLORS = {
	red100: '#fcebeb',
	red300: '#ea8484',
	red500: '#dc3232',
	red700: '#b02828',
	red900: '#841e1e',
};

export const CORE_ORANGE_COLORS = {
	orange100: '#fef1ea',
	orange300: '#f9a87e',
	orange500: '#F56E28',
	orange700: '#ca4a1f',
	orange900: '#aa3e1a',
};

export const CORE_YELLOW_COLORS = {
	yellow100: '#fff8e6',
	yellow300: '#ffd566',
	yellow500: '#ffb900',
	yellow700: '#ee8e0d',
	yellow900: '#dd631a',
};

export const CORE_GREEN_COLORS = {
	green100: '#edf8ee',
	green300: '#90d296',
	green500: '#46b450',
	green700: '#328540',
	green900: '#25612f',
};

export const CORE_BLUE_COLORS = {
	blue100: '#e6f6fb',
	blue300: '#66c6e4',
	blue500: '#00a0d2',
	blue700: '#0085ba',
	blue900: '#0072A8',
};

export const DARK_GRAY_COLORS = {
	...CORE_DARK_GRAY_COLORS,
	...createTextColors( CORE_DARK_GRAY_COLORS ),
	...createRgbaColors( CORE_DARK_GRAY_COLORS ),
};

export const LIGHT_GRAY_COLORS = {
	...CORE_LIGHT_GRAY_COLORS,
	...createTextColors( CORE_LIGHT_GRAY_COLORS ),
	...createRgbaColors( CORE_LIGHT_GRAY_COLORS ),
};

export const RED_COLORS = {
	...CORE_RED_COLORS,
	...createTextColors( CORE_RED_COLORS ),
	...createRgbaColors( CORE_RED_COLORS ),
};

export const ORANGE_COLORS = {
	...CORE_ORANGE_COLORS,
	...createTextColors( CORE_ORANGE_COLORS ),
	...createRgbaColors( CORE_ORANGE_COLORS ),
};

export const YELLOW_COLORS = {
	...CORE_YELLOW_COLORS,
	...createTextColors( CORE_YELLOW_COLORS ),
	...createRgbaColors( CORE_YELLOW_COLORS ),
};

export const GREEN_COLORS = {
	...CORE_GREEN_COLORS,
	...createTextColors( CORE_GREEN_COLORS ),
	...createRgbaColors( CORE_GREEN_COLORS ),
};

export const PURPLE_COLORS = {
	...CORE_PURPLE_COLORS,
	...createTextColors( CORE_PURPLE_COLORS ),
	...createRgbaColors( CORE_PURPLE_COLORS ),
};

export const BLUE_COLORS = {
	...CORE_BLUE_COLORS,
	...createTextColors( CORE_BLUE_COLORS ),
	...createRgbaColors( CORE_BLUE_COLORS ),
};

export const WORDPRESS_COLORS = {
	...DARK_GRAY_COLORS,
	...LIGHT_GRAY_COLORS,
	...RED_COLORS,
	...ORANGE_COLORS,
	...YELLOW_COLORS,
	...GREEN_COLORS,
	...PURPLE_COLORS,
	...BLUE_COLORS,
};

export const G2_COLORS = {
	black: '#000000',
	blueberry: '#3858E9',
	blueberryDark: '#1D35B4',
	greens: '#33F078',
	grey: '#40464D',
	greyBlack: '#1E1E1E',
	lightBlue: '#33F078',
	lightGrey: '#40464D',
	lighterGrey: '#dddddd',
	pomegrade: '#E26F56',
	wordpressBlue: '#007cba',
	white: '#ffffff',
};

export const BACKGROUND_COLOR_PROPS = {
	colorBackgroundBlue: get( 'blueRgba10' ),
	colorBackgroundBlueText: get( 'blue900' ),

	colorBackgroundDarkGray: get( 'darkGrayRgba10' ),
	colorBackgroundDarkGrayText: get( 'darkGray900' ),

	colorBackgroundGreen: get( 'greenRgba10' ),
	colorBackgroundGreenText: get( 'green900' ),

	colorBackgroundLightGray: get( 'lightGrayRgba10' ),
	colorBackgroundLightGrayText: get( 'lightGray900' ),

	colorBackgroundOrange: get( 'orangeRgba10' ),
	colorBackgroundOrangeText: get( 'orange900' ),

	colorBackgroundPurple: get( 'purpleRgba10' ),
	colorBackgroundPurpleText: get( 'purple900' ),

	colorBackgroundRed: get( 'redRgba10' ),
	colorBackgroundRedText: get( 'red900' ),

	colorBackgroundYellow: get( 'yellowRgba10' ),
	colorBackgroundYellowText: get( 'yellow900' ),
};

export const DARK_MODE_COLORS = {
	colorBackgroundBlue: get( 'blueRgba20' ),
	colorBackgroundBlueText: get( 'blue300' ),

	colorBackgroundDarkGray: get( 'darkGrayRgba20' ),
	colorBackgroundDarkGrayText: get( 'white' ),

	colorBackgroundGreen: get( 'greenRgba20' ),
	colorBackgroundGreenText: get( 'green300' ),

	colorBackgroundLightGray: get( 'lightGrayRgba20' ),
	colorBackgroundLightGrayText: get( 'white' ),

	colorBackgroundOrange: get( 'orangeRgba20' ),
	colorBackgroundOrangeText: get( 'orange300' ),

	colorBackgroundPurple: get( 'purpleRgba20' ),
	colorBackgroundPurpleText: get( 'purple300' ),

	colorBackgroundRed: get( 'redRgba20' ),
	colorBackgroundRedText: get( 'red300' ),

	colorBackgroundYellow: get( 'yellowRgba20' ),
	colorBackgroundYellowText: get( 'yellow300' ),
};

export const DARK_MODE_RGBA_COLORS = {
	...createRgbaColors( CORE_BLUE_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_GREEN_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_ORANGE_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_PURPLE_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_RED_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_YELLOW_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_DARK_GRAY_COLORS, /* isDark */ true ),
	...createRgbaColors( CORE_LIGHT_GRAY_COLORS, /* isDark */ true ),
};
