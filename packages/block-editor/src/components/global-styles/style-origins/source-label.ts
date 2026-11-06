import { __, sprintf } from '@wordpress/i18n';

/**
 * Site wide Styles sources, keyed by the first part of a style path. Each
 * names the section of the Styles screen where that root value is edited.
 */
const ROOT_SOURCE_LABELS: Record< string, string > = {
	typography: __( 'Site typography' ),
	color: __( 'Site colors' ),
	background: __( 'Site background' ),
	shadow: __( 'Site shadows' ),
	spacing: __( 'Site layout' ),
	dimensions: __( 'Site layout' ),
};

/**
 * Element names as the Styles screen shows them, keyed by element.
 */
const ELEMENT_LABELS: Record< string, string > = {
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
 * Returns the site wide source label for a style path, skipping an
 * `elements.*` prefix so `elements.link.color.text` reads as a colors value.
 *
 * @param path Style path.
 * @return Source label, or `null` when the path has no section.
 */
function getRootSourceLabel( path: string[] ): string | null {
	const [ group ] = path[ 0 ] === 'elements' ? path.slice( 2 ) : path;
	return ROOT_SOURCE_LABELS[ group ] ?? null;
}

/**
 * Turns a `resolveStyle` source descriptor into the text that names where an
 * inherited value comes from, e.g. "Site typography" or "Paragraph block".
 *
 * Returns `null` when the descriptor is missing or the layer cannot be named,
 * so a caller never shows a source the engine did not resolve.
 *
 * @param source                 Source descriptor from `resolveStyle`.
 * @param context
 * @param context.path           Style path the source applies to.
 * @param context.blockTitle     Block type title, e.g. "Paragraph".
 * @param context.elementName    Element that supplied the value, e.g. `h2`.
 * @param context.variationLabel Label of the active block style variation.
 * @return Source text, or `null`.
 */
export function getStyleSourceLabel(
	source: { layer: string } | null | undefined,
	{
		path,
		blockTitle,
		elementName,
		variationLabel,
	}: {
		path?: string[];
		blockTitle?: string | null;
		elementName?: string | null;
		variationLabel?: string | null;
	} = {}
): string | null {
	switch ( source?.layer ) {
		case 'root':
			return getRootSourceLabel( path ?? [] );
		case 'element': {
			const element = elementName ? ELEMENT_LABELS[ elementName ] : null;
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
						/* translators: %s: Block style name, e.g. "Outline". */
						__( '%s style' ),
						variationLabel
					)
				: null;
		default:
			return null;
	}
}
