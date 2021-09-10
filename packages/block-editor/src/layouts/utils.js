/**
 * Utility to generate the proper CSS selector for layout styles.
 *
 * @param {string|string[]} selectors - CSS selectors
 * @param {boolean}         append    - string to append.
 *
 * @return {string} - CSS selector.
 */
export function appendSelectors( selectors, append = '' ) {
	// Ideally we shouldn't need the `.editor-styles-wrapper` increased specificity here
	// The problem though is that we have a `.editor-styles-wrapper p { margin: reset; }` style
	// it's used to reset the default margin added by wp-admin to paragraphs
	// so we need this to be higher speficity otherwise, it won't be applied to paragraphs inside containers
	// When the post editor is fully iframed, this extra classname could be removed.

	return selectors
		.split( ',' )
		.map(
			( subselector ) =>
				`.editor-styles-wrapper ${ subselector } ${ append }`
		)
		.join( ',' );
}
