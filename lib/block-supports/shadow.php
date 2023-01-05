<?php
/**
 * Shadow block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and shadow block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_shadow_support( $block_type ) {
	if ( ! property_exists( $block_type, 'supports' ) ) {
		return;
	}

	$has_shadow_support = true; // _wp_array_get( $block_type->supports, array( 'shadow' ), false );
	if ( ! $has_shadow_support ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_shadow_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( $has_shadow_support && ! array_key_exists( 'shadow', $block_type->attributes ) ) {
		$block_type->attributes['shadow'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Add CSS classes and inline styles for typography features such as font sizes
 * to the incoming attributes array. This will be applied to the block markup in
 * the front-end.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Typography CSS classes and inline styles.
 */
function gutenberg_apply_shadow_support( $block_type, $block_attributes ) {
	if ( ! property_exists( $block_type, 'supports' ) ) {
		return array();
	}

	$has_shadow_support = true; // _wp_array_get( $block_type->supports, array( 'shadow' ), false );
	if ( ! $has_shadow_support ) {
		return array();
	}

	$shadow_block_styles = array();

	$preset_shadow = array_key_exists( 'shadow', $block_attributes ) ? "var:preset|shadow|{$block_attributes['shadow']}" : null;
    $custom_shadow                    = isset( $block_attributes['style']['shadow'] ) ? $block_attributes['style']['shadow'] : null;
    $shadow_block_styles['shadow'] = $preset_shadow ? $preset_shadow : $custom_shadow;

	$attributes = array();
	$styles     = gutenberg_style_engine_get_styles( $shadow_block_styles );

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'shadow',
	array(
		'register_attribute' => 'gutenberg_register_shadow_support',
		'apply'              => 'gutenberg_apply_shadow_support',
	)
);
