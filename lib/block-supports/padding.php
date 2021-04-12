<?php
/**
 * Padding block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_padding_support( $block_type ) {
	$has_padding_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'padding' ), false );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_padding_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes for block padding to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block padding CSS classes and inline styles.
 */
function gutenberg_apply_padding_support( $block_type, $block_attributes ) {
	$has_padding_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'padding' ), false );
	$styles              = array();
	if ( $has_padding_support ) {
		$padding_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'padding' ), null );
		if ( null !== $padding_value ) {
			foreach ( $padding_value as $key => $value ) {
				$styles[] = sprintf( 'padding-%s: %s;', $key, $value );
			}
		}
	}

	return empty( $styles ) ? array() : array( 'style' => implode( ' ', $styles ) );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'padding',
	array(
		'register_attribute' => 'gutenberg_register_padding_support',
		'apply'              => 'gutenberg_apply_padding_support',
	)
);
