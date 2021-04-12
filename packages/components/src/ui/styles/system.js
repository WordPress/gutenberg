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

/** @type {import('../create-styles').CreateStyleSystemOptions<typeof config, typeof darkModeConfig, typeof highContrastModeConfig, typeof darkHighContrastModeConfig>} */
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
