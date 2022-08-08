/**
 * Utility to generate the proper CSS selector for layout styles.
 *
 * @param {string} selectors CSS selector, also supports multiple comma-separated selectors.
 * @param {string} append    The string to append.
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
				`.editor-styles-wrapper ${ subselector }${
					append ? ` ${ append }` : ''
				}`
		)
		.join( ',' );
}

/**
 * Get generated blockGap CSS rules based on layout definitions provided in theme.json
 * Falsy values in the layout definition's spacingStyles rules will be swapped out
 * with the provided `blockGapValue`.
 *
 * @param {string} selector          The CSS selector to target for the generated rules.
 * @param {Object} layoutDefinitions Layout definitions object from theme.json.
 * @param {string} layoutType        The layout type (e.g. `default` or `flex`).
 * @param {string} blockGapValue     The current blockGap value to be applied.
 * @return {string} The generated CSS rules.
 */
export function getBlockGapCSS(
	selector,
	layoutDefinitions,
	layoutType,
	blockGapValue
) {
	let output = '';
	if (
		layoutDefinitions?.[ layoutType ]?.spacingStyles?.length &&
		blockGapValue
	) {
		layoutDefinitions[ layoutType ].spacingStyles.forEach( ( gapStyle ) => {
			output += `${ appendSelectors(
				selector,
				gapStyle.selector.trim()
			) } { `;
			output += Object.entries( gapStyle.rules )
				.map(
					( [ cssProperty, value ] ) =>
						`${ cssProperty }: ${ value ? value : blockGapValue }`
				)
				.join( '; ' );
			output += '; }';
		} );
	}
	return output;
}
