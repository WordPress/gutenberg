import { __, sprintf } from '@wordpress/i18n';

/**
 * Root level Styles sections, keyed by the first part of a style path. Each
 * names the section of the Styles screen where that root value is edited.
 *
 * @type {Record<string, string>}
 */
const ROOT_SECTION_LABELS = {
	typography: __( 'Typography' ),
	color: __( 'Colors' ),
	background: __( 'Background' ),
	shadow: __( 'Shadows' ),
	spacing: __( 'Layout' ),
	dimensions: __( 'Layout' ),
};

/**
 * Element names as the Styles screen shows them, keyed by element.
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
	caption: __( 'Caption' ),
};

/**
 * Returns the root section label for a style path, skipping an `elements.*`
 * prefix so `elements.link.color.text` reads as a Colors value.
 *
 * @param {string[]} path Style path.
 * @return {?string} Section label, or `null` when the path has no section.
 */
function getRootSectionLabel( path ) {
	const [ group ] = path[ 0 ] === 'elements' ? path.slice( 2 ) : path;
	return ROOT_SECTION_LABELS[ group ] ?? null;
}

/**
 * Turns a `resolveStyle` source descriptor into the text that names where an
 * inherited value comes from, e.g. "Typography style" or "Paragraph block".
 *
 * Returns `null` when the descriptor is missing or the layer cannot be named,
 * so a caller never shows a source the engine did not resolve.
 *
 * @param {?{ layer: string }} source                 Source descriptor from `resolveStyle`.
 * @param {Object}             context
 * @param {string[]}           context.path           Style path the source applies to.
 * @param {?string}            context.blockTitle     Block type title, e.g. "Paragraph".
 * @param {?string}            context.elementName    Element that supplied the value, e.g. `h2`.
 * @param {?string}            context.variationLabel Label of the active block style variation.
 * @return {?string} Source text, or `null`.
 */
export function getStyleSourceLabel(
	source,
	{ path, blockTitle, elementName, variationLabel } = {}
) {
	switch ( source?.layer ) {
		case 'root': {
			const section = getRootSectionLabel( path ?? [] );
			return section
				? sprintf(
						/* translators: %s: Styles section name, e.g. "Typography". */
						__( '%s style' ),
						section
					)
				: null;
		}
		case 'element': {
			const element = ELEMENT_LABELS[ elementName ];
			return element
				? sprintf(
						/* translators: %s: Element name, e.g. "Button" or "H2". */
						__( '%s element' ),
						element
					)
				: null;
		}
		case 'block':
			return blockTitle
				? sprintf(
						/* translators: %s: Block type title, e.g. "Paragraph". */
						__( '%s block' ),
						blockTitle
					)
				: null;
		case 'blockVariation':
			return variationLabel
				? sprintf(
						/* translators: %s: Block style variation name, e.g. "Annotation". */
						__( '“%s” block style variation' ),
						variationLabel
					)
				: null;
		default:
			return null;
	}
}
