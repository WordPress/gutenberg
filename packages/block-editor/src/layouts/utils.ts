import { __, sprintf } from '@wordpress/i18n';
import { LAYOUT_DEFINITIONS } from './definitions';
import type { AlignmentsInfo, Layout, LayoutDefinition } from './types';

/**
 * Utility to generate the proper CSS selector for layout styles.
 *
 * @param selectors CSS selector, also supports multiple comma-separated selectors.
 * @param append    The string to append.
 *
 * @return - CSS selector.
 */
export function appendSelectors(
	selectors: string,
	append: string = ''
): string {
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
 * @param selector          The CSS selector to target for the generated rules.
 * @param layoutDefinitions Layout definitions object.
 * @param layoutType        The layout type (e.g. `default` or `flex`).
 * @param blockGapValue     The current blockGap value to be applied.
 * @return The generated CSS rules.
 */
export function getBlockGapCSS(
	selector: string,
	layoutDefinitions: Record<
		string,
		Partial< LayoutDefinition >
	> | null = LAYOUT_DEFINITIONS,
	layoutType: string,
	blockGapValue: string | null | undefined
): string {
	let output = '';
	if (
		layoutDefinitions?.[ layoutType ]?.spacingStyles?.length &&
		blockGapValue
	) {
		// The check above guarantees the spacing styles.
		layoutDefinitions[ layoutType ].spacingStyles!.forEach(
			( gapStyle ) => {
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
			}
		);
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
 * @param layout The layout object.
 * @return An object with contextual info per alignment.
 */
export function getAlignmentsInfo( layout: Layout ): AlignmentsInfo {
	const { contentSize, wideSize, type = 'default' } = layout;
	const alignmentInfo: AlignmentsInfo = {};
	const sizeRegex =
		/^(?!0)\d+(px|em|rem|vw|vh|%|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax)?$/i;
	// `test` reads a missing size as 'undefined', which never matches.
	if ( sizeRegex.test( contentSize! ) && type === 'constrained' ) {
		// translators: %s: container size (i.e. 600px etc)
		alignmentInfo.none = sprintf( __( 'Max %s wide' ), contentSize! );
	}
	if ( sizeRegex.test( wideSize! ) ) {
		// translators: %s: container size (i.e. 600px etc)
		alignmentInfo.wide = sprintf( __( 'Max %s wide' ), wideSize! );
	}
	return alignmentInfo;
}

/**
 * Resolves the legacy layout shape to a typed one.
 *
 * Before layout types existed, a constrained layout was expressed as
 * `inherit: true` or as bare `contentSize` / `wideSize` values with no `type`.
 * Markup saved that way, such as a theme template's Post Content block, is
 * still around, and consumers that read `type` alone would resolve it to the
 * flow layout.
 *
 * @param layout The layout object.
 * @return The layout, with `type: 'constrained'` set when it was
 *         expressed in the legacy form; otherwise the same object.
 */
export function normalizeLegacyLayout< T extends Layout | null | undefined >(
	layout: T
): T | Layout {
	return layout?.inherit || layout?.contentSize || layout?.wideSize
		? { ...layout, type: 'constrained' }
		: layout;
}
