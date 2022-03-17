<?php
/**
 * Spacing block support flag.
 *
 * For backwards compatibility with core, this remains separate to the
 * dimensions.php block support despite both belonging under a single panel in
 * the editor.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_spacing_support( $block_type ) {
	$has_spacing_support = gutenberg_block_has_support( $block_type, array( 'spacing' ), false );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_spacing_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes for block spacing to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block spacing CSS classes and inline styles.
 */
function gutenberg_apply_spacing_support( $block_type, $block_attributes ) {
	if ( gutenberg_skip_spacing_serialization( $block_type ) ) {
		return array();
	}

	$has_padding_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'padding' ), false );
	$has_margin_support  = gutenberg_block_has_support( $block_type, array( 'spacing', 'margin' ), false );
	$block_styles        = isset( $block_attributes['style'] ) ? $block_attributes['style'] : null;
	$classes             = array();
	$styles              = array();
	$style_engine        = WP_Style_Engine_Gutenberg::get_instance();

	if ( $has_padding_support ) {
		$padding_styles = $style_engine->get_inline_styles_from_attributes(
			$block_styles,
			array( 'spacing', 'padding' )
		);

		if ( $padding_styles ) {
			$styles[] = $padding_styles;
		}
	}

	if ( $has_margin_support ) {
		// As with padding above.
		$margin_styles = $style_engine->get_inline_styles_from_attributes(
			$block_styles,
			array( 'spacing', 'margin' )
		);

		if ( $margin_styles ) {
			$styles[] = $margin_styles;
		}
	}

	// Collect classes and styles.
	$attributes = array();

	if ( ! empty( $classes ) ) {
		$attributes['class'] = implode( ' ', $classes );
	}

	if ( ! empty( $styles ) ) {
		$attributes['style'] = implode( '', $styles );
	}

	return $attributes;
}

/**
 * Checks whether serialization of the current block's spacing properties should
 * occur.
 *
 * @param WP_Block_type $block_type Block type.
 *
 * @return boolean Whether to serialize spacing support styles & classes.
 */
function gutenberg_skip_spacing_serialization( $block_type ) {
	$spacing_support = _wp_array_get( $block_type->supports, array( 'spacing' ), false );

	return is_array( $spacing_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $spacing_support ) &&
		$spacing_support['__experimentalSkipSerialization'];
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'spacing',
	array(
		'register_attribute' => 'gutenberg_register_spacing_support',
		'apply'              => 'gutenberg_apply_spacing_support',
	)
);
