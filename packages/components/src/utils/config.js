/**
 * Internal dependencies
 */
import CONFIG from './config-values';

/**
 * @param {keyof CONFIG} name The variable name
 * @return {string} The variable
 */
export const config = ( name ) => CONFIG[ name ];
