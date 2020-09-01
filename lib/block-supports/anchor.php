<?php
/**
 * Anchor block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the anchor block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_anchor_support( $block_type ) {
	$has_anchor_support = gutenberg_experimental_get( $block_type->supports, array( 'anchor' ), true );

	if ( $has_anchor_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'anchor', $block_type->attributes ) ) {
			$block_type->attributes['anchor'] = array(
				'type' => 'string',
			);
		}
	}

}

/**
 * Add the anchor to the output.
 *
 * @param  array         $attributes       Comprehensive list of attributes to be applied.
 * @param  array         $block_attributes Block attributes.
 * @param  WP_Block_Type $block_type       Block Type.
 *
 * @return array Block anchor.
 */
function gutenberg_apply_anchor_support( $attributes, $block_attributes, $block_type ) {
	$has_anchor_support = gutenberg_experimental_get( $block_type->supports, array( 'anchor' ), true );
	if ( $has_anchor_support ) {
		$has_anchor = array_key_exists( 'anchor', $block_attributes );

		if ( $has_anchor ) {
			$attributes['anchor'] = $block_attributes['anchor'];
		}
	}

	return $attributes;
}
