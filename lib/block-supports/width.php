<?php
/**
 * Width block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and width block attributes for block types that
 * support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_width_support( $block_type ) {
	// Determine if width supported.
	$has_width_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_width_support = gutenberg_experimental_get( $block_type->supports, array( '__experimentalWidth' ), false );
	}

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_width_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}
