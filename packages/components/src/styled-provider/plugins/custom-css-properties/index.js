/**
 * Internal dependencies
 */
import { hasVariable, getFallbackDeclaration } from './utils';

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
export function stylisPluginCssCustomProperties() {
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
		// Borrowed guard implementation from:
		// https://github.com/Andarist/stylis-plugin-extra-scope/blob/master/src/index.js#L15
		if ( context !== 2 || type === 107 || seen.has( selectors ) ) return;

		// We only need to process the content if a CSS var() is used.
		if ( ! hasVariable( content ) ) return;

		// Add to our seen cache, as implemented in stylis-plugin-extra-scope
		seen.add( selectors );

		/*
		 * Attempts to deconstruct the content to retrieve prop/value
		 * CSS declaration pairs.
		 *
		 * Example:
		 * background-color:var(--bg, black); font-size:14px;
		 *
		 * Becomes...
		 * ["background-color:var(--bg, black)", " font-size:14px"]
		 */
		const declarations = content.split( ';' ).filter( Boolean );

		/*
		 * With the declaration collection, we'll iterate over every declaration
		 * to provide fallbacks (if applicable.)
		 */
		const parsed = declarations.reduce( ( styles, declaration ) => {
			// Retrieve the fallback a CSS variable is used in this declaration.
			if ( hasVariable( declaration ) ) {
				const fallback = getFallbackDeclaration( declaration );
				/*
				 * Prepend the fallback in our styles set.
				 *
				 * Example:
				 * [
				 * 	 ...styles,
				 *   'background-color:var(--bg, black);'
				 * ]
				 *
				 * Becomes...
				 * [
				 * 	 ...styles,
				 *   'background:black;',
				 *   'background-color:var(--bg, black);'
				 * ]
				 */
				return [ ...styles, fallback, declaration ];
			}
			// If no CSS variable is used, we return the declaration untouched.
			return [ ...styles, declaration ];
		}, [] );

		/*
		 * We'll rejoin our declarations with a ; separator.
		 * Note: We need to add a ; at the end for stylis to interpret correctly.
		 */
		const nextContent = `${ parsed.join( ';' ) };`;

		// Lastly, we'll provide stylis with our enhanced CSS variable supported content.
		return nextContent;
	};

	return plugin;
}

export default stylisPluginCssCustomProperties;
