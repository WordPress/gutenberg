/**
 * External dependencies
 */
import cssGridPlugin from 'styled-griddie';

/**
 * Internal dependencies
 */
import cssVariablesPlugin from './css-variables';
import specificityPlugin from './extra-specificity';

const isProd = process.env.NODE_ENV === 'production';

/**
 * A collection of custom Stylis plugins to enhance the way the compiler (Emotion)
 * generates selectors and CSS rules.
 *
 * @param {Object} options
 * @param {number} [options.specificityLevel=7]
 * @param {string} [options.key='css']
 * @param {boolean} [options.skipSupportedBrowsers]
 * @param {import('../../css-custom-properties').RootStore} [options.rootStore]
 * @return {import('@emotion/stylis').Plugin[]} The list of stylis plugins.
 */
export function createPlugins( {
	specificityLevel = 1,
	key = 'css',
	rootStore,
	skipSupportedBrowsers = isProd,
} ) {
	return [
		cssVariablesPlugin( { skipSupportedBrowsers, rootStore } ),
		specificityPlugin( { level: specificityLevel, key } ),
		// @ts-ignore styled-griddie imports StylisPlugin from `styled-components` which has different types from the actual one we're using here
		cssGridPlugin,
	];
}
