import { capitalCase } from 'change-case';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Readable names for the top-level Global Styles sections, used to name a
 * root-level source, e.g. "Typography style".
 *
 * @type {Record<string, string>}
 */
const SECTION_LABELS = {
	typography: __( 'Typography' ),
	color: __( 'Color' ),
	spacing: __( 'Spacing' ),
	border: __( 'Border' ),
	dimensions: __( 'Dimensions' ),
	background: __( 'Background' ),
	shadow: __( 'Shadow' ),
	filter: __( 'Filters' ),
	elements: __( 'Elements' ),
};

/**
 * Readable names for the root-level element layers that can paint a block
 * (see `getElementLayers` in `@wordpress/block-editor`).
 *
 * @type {Record<string, string>}
 */
const ELEMENT_LABELS = {
	button: __( 'Button' ),
	link: __( 'Link' ),
	heading: __( 'Heading' ),
	h1: __( 'H1' ),
	h2: __( 'H2' ),
	h3: __( 'H3' ),
	h4: __( 'H4' ),
	h5: __( 'H5' ),
	h6: __( 'H6' ),
};

/**
 * Names the Global Styles layer a style value comes from.
 *
 * Only the layers `resolveStyle` reports are named. A missing source means
 * nothing in Global Styles sets the value. Block stylesheets are invisible to
 * the engine, so the copy says only what is known: "Not set in Global Styles".
 *
 * @param {?Object} source                   Source descriptor from `resolveStyle`, plus the matched `element` for the element layer.
 * @param {string}  source.layer             One of `root`, `element`, `block` or `blockVariation`.
 * @param {string}  [source.element]         Element key for the element layer, e.g. `button`.
 * @param {Object}  context                  Naming context.
 * @param {string}  context.pathKey          Style path the source is for, e.g. `typography.fontSize`.
 * @param {string}  context.blockTitle       Block title, e.g. "Paragraph".
 * @param {string}  [context.variationLabel] Label of the active block style variation.
 *
 * @return {string} Readable source name.
 */
export function getStyleSourceLabel(
	source,
	{ pathKey, blockTitle, variationLabel }
) {
	switch ( source?.layer ) {
		case 'root': {
			const section = pathKey.split( '.' )[ 0 ];
			return sprintf(
				// translators: %s: Global Styles section, e.g. "Typography".
				__( '%s style' ),
				SECTION_LABELS[ section ] ?? capitalCase( section )
			);
		}
		case 'element':
			return source.element
				? sprintf(
						// translators: %s: Element name, e.g. "Button".
						__( '%s element' ),
						ELEMENT_LABELS[ source.element ] ??
							capitalCase( source.element )
					)
				: __( 'Element' );
		case 'block':
			return sprintf(
				// translators: %s: Block title, e.g. "Paragraph".
				__( '%s block' ),
				blockTitle
			);
		case 'blockVariation':
			return sprintf(
				// translators: %s: Block style variation label, e.g. "Outline".
				__( '“%s” block style variation' ),
				variationLabel
			);
		default:
			return __( 'Not set in Global Styles' );
	}
}
