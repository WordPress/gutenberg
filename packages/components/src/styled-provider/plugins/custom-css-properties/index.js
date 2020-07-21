/**
 * Internal dependencies
 */
import {
	isNativeSupport,
	hasVariable,
	memoizedTransformContent,
} from './utils';

/*
 * This plugin is for the stylis library. It's the CSS compiler used by
 * CSS-in-JS libraries like Emotion.
 *
 * https://github.com/thysultan/stylis.js
 */

/*
 * Generates fallback values for CSS rule declarations that contain CSS var().
 * This plugin parses uses specified fallback values within the var()
 * function. If one is not provided, it will attempt to use the matching
 * variable declared at the :root scope.
 */
export function stylisPluginCssCustomProperties( {
	skipSupportedBrowsers = true,
} ) {
	const seen = new WeakSet();

	const plugin = (
		context,
		content,
		selectors,
		parents,
		line,
		column,
		length,
		type
	) => {
		// Skip generating CSS variable fallbacks for supported browsers
		if ( skipSupportedBrowsers && isNativeSupport ) return;

		// Borrowed guard implementation from:
		// https://github.com/Andarist/stylis-plugin-extra-scope/blob/master/src/index.js#L15
		if ( context !== 2 || type === 107 || seen.has( selectors ) ) return;

		// We only need to process the content if a CSS var() is used.
		if ( ! hasVariable( content ) ) return;

		// Add to our seen cache, as implemented in stylis-plugin-extra-scope
		seen.add( selectors );

		// We'll parse the content to match variables to their custom properties (if possible).
		const nextContent = memoizedTransformContent( content );

		// Lastly, we'll provide stylis with our enhanced CSS variable supported content.
		return nextContent;
	};

	return plugin;
}

export default stylisPluginCssCustomProperties;
