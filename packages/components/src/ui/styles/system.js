/**
 * Internal dependencies
 */
import { createStyleSystem, get as getConfig } from '../create-styles';
import {
	config,
	darkHighContrastModeConfig,
	darkModeConfig,
	highContrastModeConfig,
} from './theme';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {
 | 'colorAdmin'
 | 'colorAdminRgba10'
 | 'colorAdminRgba20'
 | 'colorAdminRgba30'
 | 'colorAdminRgba40'
 | 'colorAdminRgba50'
 | 'colorAdminRgba60'
 | 'colorAdminRgba70'
 | 'colorAdminRgba80'
 | 'colorAdminRgba90'
 | 'colorDestructive'
 | 'colorDestructiveRgba10'
 | 'colorDestructiveRgba20'
 | 'colorDestructiveRgba30'
 | 'colorDestructiveRgba40'
 | 'colorDestructiveRgba50'
 | 'colorDestructiveRgba60'
 | 'colorDestructiveRgba70'
 | 'colorDestructiveRgba80'
 | 'colorDestructiveRgba90'
 | 'gray100Text'
 | 'gray300Text'
 | 'gray500Text'
 | 'gray700Text'
 | 'gray900Text'
 | 'darkGray100Text'
 | 'darkGray300Text'
 | 'darkGray500Text'
 | 'darkGray700Text'
 | 'darkGray900Text'
 | 'red100Text'
 | 'red300Text'
 | 'red500Text'
 | 'red700Text'
 | 'red900Text'
 | 'orange100Text'
 | 'orange300Text'
 | 'orange500Text'
 | 'orange700Text'
 | 'orange900Text'
 | 'yellow100Text'
 | 'yellow300Text'
 | 'yellow500Text'
 | 'yellow700Text'
 | 'yellow900Text'
 | 'green100Text'
 | 'green300Text'
 | 'green500Text'
 | 'green700Text'
 | 'green900Text'
 | 'purple100Text'
 | 'purple300Text'
 | 'purple500Text'
 | 'purple700Text'
 | 'purple900Text'
 | 'purple100Text'
 | 'purple300Text'
 | 'purple500Text'
 | 'purple700Text'
 | 'purple900Text'
 | 'grayRgba10'
 | 'grayRgba20'
 | 'grayRgba30'
 | 'grayRgba40'
 | 'grayRgba50'
 | 'grayRgba60'
 | 'grayRgba70'
 | 'grayRgba80'
 | 'grayRgba90'
 | 'darkGrayRgba10'
 | 'darkGrayRgba20'
 | 'darkGrayRgba30'
 | 'darkGrayRgba40'
 | 'darkGrayRgba50'
 | 'darkGrayRgba60'
 | 'darkGrayRgba70'
 | 'darkGrayRgba80'
 | 'darkGrayRgba90'
 | 'redRgba10'
 | 'redRgba20'
 | 'redRgba30'
 | 'redRgba40'
 | 'redRgba50'
 | 'redRgba60'
 | 'redRgba70'
 | 'redRgba80'
 | 'redRgba90'
 | 'orangeRgba10'
 | 'orangeRgba20'
 | 'orangeRgba30'
 | 'orangeRgba40'
 | 'orangeRgba50'
 | 'orangeRgba60'
 | 'orangeRgba70'
 | 'orangeRgba80'
 | 'orangeRgba90'
 | 'yellowRgba10'
 | 'yellowRgba20'
 | 'yellowRgba30'
 | 'yellowRgba40'
 | 'yellowRgba50'
 | 'yellowRgba60'
 | 'yellowRgba70'
 | 'yellowRgba80'
 | 'yellowRgba90'
 | 'greenRgba10'
 | 'greenRgba20'
 | 'greenRgba30'
 | 'greenRgba40'
 | 'greenRgba50'
 | 'greenRgba60'
 | 'greenRgba70'
 | 'greenRgba80'
 | 'greenRgba90'
 | 'purpleRgba10'
 | 'purpleRgba20'
 | 'purpleRgba30'
 | 'purpleRgba40'
 | 'purpleRgba50'
 | 'purpleRgba60'
 | 'purpleRgba70'
 | 'purpleRgba80'
 | 'purpleRgba90'
 | 'blueRgba10'
 | 'blueRgba20'
 | 'blueRgba30'
 | 'blueRgba40'
 | 'blueRgba50'
 | 'blueRgba60'
 | 'blueRgba70'
 | 'blueRgba80'
 | 'blueRgba90'
 
 // Theme tokens that pop up throughout the codebase
 | 'flexGap'
 | 'flexItemDisplay'
 | 'surfaceBackgroundSize'
 | 'surfaceBackgroundSizeDotted'
} GeneratedDesignTokens
 */
/* eslint-enable jsdoc/valid-types */

/** @type {import('../create-styles').CreateStyleSystemOptions<typeof config, typeof darkModeConfig, typeof highContrastModeConfig, typeof darkHighContrastModeConfig, GeneratedDesignTokens>} */
const systemConfig = {
	baseStyles: {
		MozOsxFontSmoothing: 'grayscale',
		WebkitFontSmoothing: 'antialiased',
		fontFamily: getConfig( 'fontFamily' ),
		fontSize: getConfig( 'fontSize' ),
		// @ts-ignore
		fontWeight: getConfig( 'fontWeight' ),
		margin: 0,
	},
	config,
	darkModeConfig,
	highContrastModeConfig,
	darkHighContrastModeConfig,
};

export const {
	compiler,
	core,
	createCoreElement,
	createToken,
	get,
	styled,
} = createStyleSystem( systemConfig );
