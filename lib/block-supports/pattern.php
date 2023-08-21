<?php
/**
 * Pattern block support flag.
 *
 * @package gutenberg
 */

/**
 * Adds the pattern `dynamicContent` and `setDynamicContent` items to the
 * block's `usesContext` configuration.
 *
 * @param WP_Block_Type $block_type Block type.
 */
function gutenberg_register_pattern_support( $block_type ) {
	$pattern_support = property_exists( $block_type, 'supports' ) ? _wp_array_get( $block_type->supports, array( '__experimentalPattern' ), false ) : false;

	if ( $pattern_support ) {
		if ( ! $block_type->uses_context ) {
			$block_type->uses_context = array();
		}

		if ( ! in_array( 'dynamicContent', $block_type->uses_context ) ) {
			$block_type->uses_context[] = 'dynamicContent';
		}

		if ( ! in_array( 'setDynamicContent', $block_type->uses_context ) ) {
			$block_type->uses_context[] = 'setDynamicContent';
		}
	}
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'pattern',
	array(
		'register_attribute' => 'gutenberg_register_pattern_support',
	)
);
