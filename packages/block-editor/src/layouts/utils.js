/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LAYOUT_DEFINITIONS } from './definitions';

/**
 * Utility to generate the proper CSS selector for layout styles.
 *
 * @param {string} selectors CSS selector, also supports multiple comma-separated selectors.
 * @param {string} append    The string to append.
 *
 * @return {string} - CSS selector.
 */
export function appendSelectors( selectors, append = '' ) {
	return selectors
		.split( ',' )
		.map(
			( subselector ) =>
				`${ subselector }${ append ? ` ${ append }` : '' }`
		)
		.join( ',' );
}

/**
 * Get generated blockGap CSS rules based on layout definitions provided in theme.json
 * Falsy values in the layout definition's spacingStyles rules will be swapped out
 * with the provided `blockGapValue`.
 *
 * @param {string} selector          The CSS selector to target for the generated rules.
 * @param {Object} layoutDefinitions Layout definitions object.
 * @param {string} layoutType        The layout type (e.g. `default` or `flex`).
 * @param {string} blockGapValue     The current blockGap value to be applied.
 * @return {string} The generated CSS rules.
 */
export function getBlockGapCSS(
	selector,
	layoutDefinitions = LAYOUT_DEFINITIONS,
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

/**
 * Helper method to assign contextual info to clarify
 * alignment settings.
 *
 * Besides checking if `contentSize` and `wideSize` have a
 * value, we now show this information only if their values
 * are not a `css var`. This needs to change when parsing
 * css variables land.
 *
 * @see https://github.com/WordPress/gutenberg/pull/34710#issuecomment-918000752
 *
 * @param {Object} layout The layout object.
 * @return {Object} An object with contextual info per alignment.
 */
export function getAlignmentsInfo( layout ) {
	const { contentSize, wideSize, type = 'default' } = layout;
	const alignmentInfo = {};
	const sizeRegex =
		/^(?!0)\d+(px|em|rem|vw|vh|%|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax)?$/i;
	if ( sizeRegex.test( contentSize ) && type === 'constrained' ) {
		// translators: %s: container size (i.e. 600px etc)
		alignmentInfo.none = sprintf( __( 'Max %s wide' ), contentSize );
	}
	if ( sizeRegex.test( wideSize ) ) {
		// translators: %s: container size (i.e. 600px etc)
		alignmentInfo.wide = sprintf( __( 'Max %s wide' ), wideSize );
	}
	return alignmentInfo;
}
