<?php
/**
 * Typography block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and typography block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_typography_support( $block_type ) {
	$has_font_size_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_font_size_support = gutenberg_experimental_get( $block_type->supports, array( 'fontSize' ), false );
	}

	$has_font_style_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_font_style_support = gutenberg_experimental_get( $block_type->supports, array( '__experimentalFontStyle' ), false );
	}

	$has_line_height_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_line_height_support = gutenberg_experimental_get( $block_type->supports, array( 'lineHeight' ), false );
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ( $has_font_size_support || $has_line_height_support || $has_font_style_support ) && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( $has_font_size_support && ! array_key_exists( 'fontSize', $block_type->attributes ) ) {
		$block_type->attributes['fontSize'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Add CSS classes and inline styles for font sizes to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  array         $attributes       Comprehensive list of attributes to be applied.
 * @param  array         $block_attributes Block attributes.
 * @param  WP_Block_Type $block_type       Block type.
 *
 * @return array Font size CSS classes and inline styles.
 */
function gutenberg_apply_typography_support( $attributes, $block_attributes, $block_type ) {
	if ( ! property_exists( $block_type, 'supports' ) ) {
		return $attributes;
	}

	$has_font_size_support   = gutenberg_experimental_get( $block_type->supports, array( 'fontSize' ), false );
	$has_font_style_support  = gutenberg_experimental_get( $block_type->supports, array( '__experimentalFontStyle' ), false );
	$has_line_height_support = gutenberg_experimental_get( $block_type->supports, array( 'lineHeight' ), false );

	// Font Size.
	if ( $has_font_size_support ) {
		$has_named_font_size  = array_key_exists( 'fontSize', $block_attributes );
		$has_custom_font_size = isset( $block_attributes['style']['typography']['fontSize'] );

		// Apply required class or style.
		if ( $has_named_font_size ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-font-size', $block_attributes['fontSize'] );
		} elseif ( $has_custom_font_size ) {
			$attributes['inline_styles'][] = sprintf( 'font-size: %spx;', $block_attributes['style']['typography']['fontSize'] );
		}
	}

	// Font Style.
	if ( $has_font_style_support ) {
		$font_style = gutenberg_typography_get_css_variable_inline_style( $block_attributes, 'fontStyle', 'font-style' );
		if ( $font_style ) {
			$attributes['inline_styles'][] = $font_style;
		}
	}

	// Line Height.
	if ( $has_line_height_support ) {
		$has_line_height = isset( $block_attributes['style']['typography']['lineHeight'] );
		// Add the style (no classes for line-height).
		if ( $has_line_height ) {
			$attributes['inline_styles'][] = sprintf( 'line-height: %s;', $block_attributes['style']['typography']['lineHeight'] );
		}
	}

	return $attributes;
}

/**
 * Generates an inline style for a typography feature e.g. text decoration,
 * text transform, and font style.
 *
 * @param array  $attributes   Block's attributes.
 * @param string $feature      Key for the feature within the typography styles.
 * @param string $css_property Slug for the CSS property the inline style sets.
 *
 * @return string              CSS inline style.
 */
function gutenberg_typography_get_css_variable_inline_style( $attributes, $feature, $css_property ) {
	// Retrieve current attribute value or skip if not found.
	$style_value = gutenberg_experimental_get( $attributes, array( 'style', 'typography', $feature ), false );
	if ( ! $style_value ) {
		return;
	}

	// If we don't have a preset CSS variable, we'll assume it's a regular CSS value.
	if ( strpos( $style_value, "var:preset|{$css_property}|" ) === false ) {
		return sprintf( '%s:%s;', $css_property, $style_value );
	}

	// We have a preset CSS variable as the style.
	// Get the style value from the string and return CSS style.
	$index_to_splice = strrpos( $style_value, '|' ) + 1;
	$slug            = substr( $style_value, $index_to_splice );

	// Return the actual CSS inline style e.g. `text-decoration:var(--wp--preset--text-decoration--underline);`.
	return sprintf( '%s:var(--wp--preset--%s--%s);', $css_property, $css_property, $slug );
}
