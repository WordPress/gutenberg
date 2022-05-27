<?php
/**
 * HTML tag support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the tagname for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_tagname_support( $block_type ) {
	if ( ! property_exists( $block_type, 'supports' ) ) {
		return;
	}

	$tagname_supports = _wp_array_get( $block_type->supports, array( '__experimentalTagName' ), false );
	if ( ! $tagname_supports ) {
		return;
	}

	$has_tagname_support = _wp_array_get( $tagname_supports, array( '__experimentalTagName' ), false );

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_tagname_support && ! array_key_exists( 'tagName', $block_type->attributes ) ) {
		$block_type->attributes['tagName'] = array(
			'type' => 'string',
		);
	}
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'__experimentalTagName',
	array(
		'register_attribute' => 'gutenberg_register_tagname_support',
	)
);
