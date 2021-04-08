/**
 * External dependencies
 */
import cssGridPlugin from 'styled-griddie';

/**
 * Internal dependencies
 */
import specificityPlugin from './extra-specificity';

/**
 * A collection of custom Stylis plugins to enhance the way the compiler (Emotion)
 * generates selectors and CSS rules.
 *
 * @param {Object} options
 * @param {number} [options.specificityLevel=7]
 * @param {string} [options.key='css']
 * @return {import('@emotion/stylis').Plugin[]} The list of stylis plugins.
 */
export function createPlugins( { specificityLevel = 1, key = 'css' } ) {
	return [
		specificityPlugin( { level: specificityLevel, key } ),
		// @ts-ignore styled-griddie imports StylisPlugin from `styled-components` which has different types from the actual one we're using here
		cssGridPlugin,
	];
}
