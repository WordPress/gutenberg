/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Human-readable labels for style paths, keyed by `path.join( '.' )`.
 *
 * The block style property config (`__EXPERIMENTAL_STYLE_PROPERTY`) does not
 * carry display labels, so they are authored here. Any path without an entry
 * falls back to a humanized version of its last segment (see `getStyleLabel`).
 *
 * @type {Record<string, string>}
 */
export const STYLE_LABELS = {
	// Typography.
	'typography.fontFamily': __( 'Font family' ),
	'typography.fontSize': __( 'Font size' ),
	'typography.fontStyle': __( 'Font style' ),
	'typography.fontWeight': __( 'Font weight' ),
	'typography.lineHeight': __( 'Line height' ),
	'typography.letterSpacing': __( 'Letter spacing' ),
	'typography.textDecoration': __( 'Text decoration' ),
	'typography.textTransform': __( 'Letter case' ),
	'typography.textColumns': __( 'Text columns' ),
	'typography.writingMode': __( 'Orientation' ),

	// Color.
	'color.text': __( 'Text color' ),
	'color.background': __( 'Background color' ),
	'color.gradient': __( 'Gradient' ),
	'elements.link.color.text': __( 'Link color' ),

	// Spacing.
	'spacing.padding': __( 'Padding' ),
	'spacing.margin': __( 'Margin' ),
	'spacing.blockGap': __( 'Block spacing' ),

	// Border.
	border: __( 'Border' ),
	'border.top': __( 'Border top' ),
	'border.right': __( 'Border right' ),
	'border.bottom': __( 'Border bottom' ),
	'border.left': __( 'Border left' ),
	'border.color': __( 'Border color' ),
	'border.width': __( 'Border width' ),
	'border.style': __( 'Border style' ),
	'border.radius': __( 'Border radius' ),

	// Dimensions.
	'dimensions.minHeight': __( 'Minimum height' ),
	'dimensions.aspectRatio': __( 'Aspect ratio' ),
};

/**
 * Returns a human-readable label for a given style path.
 *
 * When the path has no authored label it falls back to a humanized version of
 * the path's last segment so nothing renders blank.
 *
 * @param {string[]} path Style path, e.g. `[ 'color', 'background' ]`.
 *
 * @return {string} A human-readable label.
 */
export function getStyleLabel( path ) {
	const key = path.join( '.' );
	if ( STYLE_LABELS[ key ] ) {
		return STYLE_LABELS[ key ];
	}
	return capitalCase( path[ path.length - 1 ] ?? '' );
}
