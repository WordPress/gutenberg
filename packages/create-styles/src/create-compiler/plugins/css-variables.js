/**
 * Internal dependencies
 */
import { createRootStore } from '../../css-custom-properties';
import { transformContent } from '../../css-custom-properties/transform-content';
import { hasVariable } from '../../css-custom-properties/utils';
import { STYLIS_CONTEXTS, STYLIS_TOKENS } from './utils';

// Detects native CSS varialble support
// https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
const isNativeSupport =
	typeof window !== 'undefined' && window?.CSS?.supports?.( '(--a: 0)' );

/*
 * This plugin is for the stylis library. It's the CSS compiler used by
 * CSS-in-JS libraries like Emotion.
 *
 * https://github.com/thysultan/stylis.js
 */

const defaultOptions = {
	rootStore: createRootStore(),
	skipSupportedBrowsers: true,
};

/*
 * Generates fallback values for CSS rule declarations that contain CSS var().
 * This plugin parses uses specified fallback values within the var()
 * function. If one is not provided, it will attempt to use the matching
 * variable declared at the :root scope.
 */
function stylisPluginCssVariables(
	/* istanbul ignore next */
	options = {}
) {
	const { rootStore, skipSupportedBrowsers } = {
		...defaultOptions,
		...options,
	};

	const plugin = (
		/** @type {number} */ context,
		/** @type {string} */ content,
		/** @type {unknown} */ _,
		/** @type {unknown} */ __,
		/** @type {unknown} */ ___,
		/** @type {unknown} */ ____,
		/** @type {unknown} */ _____,
		/** @type {number} */ type
	) => {
		// Skip generating CSS variable fallbacks for supported browsers
		if ( skipSupportedBrowsers && isNativeSupport ) return;

		// Borrowed guard implementation from:
		// https://github.com/Andarist/stylis-plugin-extra-scope/blob/master/src/index.js#L15
		/* istanbul ignore next */
		if (
			context !== STYLIS_CONTEXTS.SELECTOR_BLOCK ||
			type === STYLIS_TOKENS.KEYFRAME
		) {
			return;
		}

		// We only need to process the content if a CSS var() is used.
		if ( ! hasVariable( content ) ) return;

		// We'll parse the content to match variables to their custom properties (if possible).
		const nextContent = transformContent( content, rootStore );

		// Lastly, we'll provide stylis with our enhanced CSS variable supported content.
		return nextContent;
	};

	return plugin;
}

export default stylisPluginCssVariables;
