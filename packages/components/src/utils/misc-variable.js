/**
 * Internal dependencies
 */
import miscVariables from './misc-variable-values';

/**
 * @param {keyof miscVariables} name The variable name
 * @return {string} The variable
 */
export const variable = ( name ) => miscVariables[ name ];
