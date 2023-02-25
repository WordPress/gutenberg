<?php
/**
 * Anchor block support flag.
 *
 * @package gutenberg
 */

/**
 * Add the anchor to the output.
 *
 * @param WP_Block_Type $block_type Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block anchor.
 */
function gutenberg_apply_anchor_support( $block_type, $block_attributes ) {
	if ( ! $block_attributes ) {
		return array();
	}

	if ( wp_should_skip_block_supports_serialization( $block_type, 'anchor' ) ) {
		return array();
	}

	$has_anchor_support = _wp_array_get( $block_type->supports, array( 'anchor' ), true );
	if ( ! $has_anchor_support ) {
		return array();
	}

	$has_anchor = array_key_exists( 'anchor', $block_attributes );
	if ( ! $has_anchor ) {
		return array();
	}

	return array( 'id' => $block_attributes['anchor'] );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'anchor',
	array(
		'apply' => 'gutenberg_apply_anchor_support',
	)
);
