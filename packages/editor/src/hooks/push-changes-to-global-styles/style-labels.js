/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Readable labels for style paths, keyed by `path.join( '.' )`.
 *
 * The block style config (`__EXPERIMENTAL_STYLE_PROPERTY`) has no labels of its
 * own, so they live here. A path with no entry falls back to a readable version
 * of its last part (see `getStyleLabel`).
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
 * Returns a readable label for a style path.
 *
 * When the path has no label of its own, it falls back to a readable version of
 * the path's last part so nothing shows up blank.
 *
 * @param {string[]} path Style path, e.g. `[ 'color', 'background' ]`.
 *
 * @return {string} A readable label.
 */
export function getStyleLabel( path ) {
	const key = path.join( '.' );
	if ( STYLE_LABELS[ key ] ) {
		return STYLE_LABELS[ key ];
	}
	return capitalCase( path[ path.length - 1 ] ?? '' );
}
