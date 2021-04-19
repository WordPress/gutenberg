/**
 * Internal dependencies
 */
import {
	transformValuesToReferences,
	transformValuesToVariables,
	transformValuesToVariablesString,
} from './utils';

/**
 * @typedef CreateCSSCustomPropertiesProps
 * @property {import('./utils').StyleConfigValues} config Default theme config.
 */

/**
 * @typedef CreateCSSCustomPropertiesResults
 * @property {import('./utils').StyleConfig} theme A set of theme style references.
 * @property {import('./utils').StyleConfig} globalVariables A set of global variables.
 * @property {string} globalCSSVariables The compiled CSS string for global variables.
 */

/**
 * Generates theme references and compiles CSS variables to be used by the Style System.
 *
 * @param {CreateCSSCustomPropertiesProps} props Props to generate a Style system theme with.
 * @return {CreateCSSCustomPropertiesResults} A set of variables and content for the System.
 */
export function createCSSCustomProperties( { config = {} } ) {
	const theme = transformValuesToReferences( config );
	const globalVariables = transformValuesToVariables( config );
	const globalCSSVariables = transformValuesToVariablesString(
		':root',
		config
	);

	return {
		theme,
		globalVariables,
		globalCSSVariables,
	};
}
