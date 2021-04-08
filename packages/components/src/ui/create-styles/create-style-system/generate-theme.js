/**
 * External dependencies
 */
import { repeat } from 'lodash';

/**
 * Internal dependencies
 */
import {
	DARK_HIGH_CONTRAST_MODE_MODE_ATTR,
	DARK_MODE_ATTR,
	HIGH_CONTRAST_MODE_MODE_ATTR,
	MODE_SPECIFICITY_COMPOUND_LEVEL,
} from './constants';
import {
	transformValuesToReferences,
	transformValuesToVariables,
	transformValuesToVariablesString,
} from './utils';

/**
 * @typedef GenerateThemeProps
 * @property {import('./utils').StyleConfigValues} config Default theme config.
 * @property {import('./utils').StyleConfigValues} darkModeConfig Dark mode theme config.
 * @property {import('./utils').StyleConfigValues} highContrastModeConfig High contrast mode theme config.
 * @property {import('./utils').StyleConfigValues} darkHighContrastModeConfig Dark high contrast mode theme config.
 */

/**
 * @typedef GenerateThemeResults
 * @property {import('./utils').StyleConfig} theme A set of theme style references.
 * @property {import('./utils').StyleConfig} globalVariables A set of global variables.
 * @property {string} globalCSSVariables The compiled CSS string for global variables.
 * @property {string} darkModeCSSVariables The compiled CSS string for global dark variables.
 * @property {string} highContrastModeCSSVariables The compiled CSS string for global high contrast variables.
 * @property {string} darkHighContrastModeCSSVariables The compiled CSS string for global dark high contrast variables.
 */

/**
 * Generates theme references and compiles CSS variables to be used by the Style System.
 *
 * @param {GenerateThemeProps} props Props to generate a Style system theme with.
 * @return {GenerateThemeResults} A set of variables and content for the System.
 */
export function generateTheme( {
	config = {},
	darkModeConfig = {},
	highContrastModeConfig = {},
	darkHighContrastModeConfig = {},
} ) {
	const theme = transformValuesToReferences( config );
	const globalVariables = transformValuesToVariables( config );
	const globalCSSVariables = transformValuesToVariablesString(
		':root',
		config
	);

	const darkModeCSSVariables = transformValuesToVariablesString(
		repeat( DARK_MODE_ATTR, MODE_SPECIFICITY_COMPOUND_LEVEL ),
		darkModeConfig
	);

	const highContrastModeCSSVariables = transformValuesToVariablesString(
		repeat( HIGH_CONTRAST_MODE_MODE_ATTR, MODE_SPECIFICITY_COMPOUND_LEVEL ),
		highContrastModeConfig
	);

	const darkHighContrastModeCSSVariables = transformValuesToVariablesString(
		repeat(
			DARK_HIGH_CONTRAST_MODE_MODE_ATTR,
			MODE_SPECIFICITY_COMPOUND_LEVEL
		),
		darkHighContrastModeConfig
	);

	return {
		theme,
		globalVariables,
		globalCSSVariables,
		darkModeCSSVariables,
		highContrastModeCSSVariables,
		darkHighContrastModeCSSVariables,
	};
}
