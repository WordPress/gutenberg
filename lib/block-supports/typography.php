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
	if ( ! property_exists( $block_type, 'supports' ) ) {
		return;
	}

	$typography_supports = _wp_array_get( $block_type->supports, array( 'typography' ), false );
	if ( ! $typography_supports ) {
		return;
	}

	$has_font_family_support     = _wp_array_get( $typography_supports, array( '__experimentalFontFamily' ), false );
	$has_font_size_support       = _wp_array_get( $typography_supports, array( 'fontSize' ), false );
	$has_font_style_support      = _wp_array_get( $typography_supports, array( '__experimentalFontStyle' ), false );
	$has_font_weight_support     = _wp_array_get( $typography_supports, array( '__experimentalFontWeight' ), false );
	$has_letter_spacing_support  = _wp_array_get( $typography_supports, array( '__experimentalLetterSpacing' ), false );
	$has_line_height_support     = _wp_array_get( $typography_supports, array( 'lineHeight' ), false );
	$has_text_decoration_support = _wp_array_get( $typography_supports, array( '__experimentalTextDecoration' ), false );
	$has_text_transform_support  = _wp_array_get( $typography_supports, array( '__experimentalTextTransform' ), false );

	$has_typography_support = $has_font_family_support
		|| $has_font_size_support
		|| $has_font_style_support
		|| $has_font_weight_support
		|| $has_letter_spacing_support
		|| $has_line_height_support
		|| $has_text_decoration_support
		|| $has_text_transform_support;

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_typography_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
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
 * Add CSS classes and inline styles for typography features such as font sizes
 * to the incoming attributes array. This will be applied to the block markup in
 * the front-end.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Typography CSS classes and inline styles.
 */
function gutenberg_apply_typography_support( $block_type, $block_attributes ) {
	if ( ! property_exists( $block_type, 'supports' ) ) {
		return array();
	}

	$typography_supports = _wp_array_get( $block_type->supports, array( 'typography' ), false );
	if ( ! $typography_supports ) {
		return array();
	}

	if ( gutenberg_should_skip_block_supports_serialization( $block_type, 'typography' ) ) {
		return array();
	}

	$has_font_family_support     = _wp_array_get( $typography_supports, array( '__experimentalFontFamily' ), false );
	$has_font_size_support       = _wp_array_get( $typography_supports, array( 'fontSize' ), false );
	$has_font_style_support      = _wp_array_get( $typography_supports, array( '__experimentalFontStyle' ), false );
	$has_font_weight_support     = _wp_array_get( $typography_supports, array( '__experimentalFontWeight' ), false );
	$has_letter_spacing_support  = _wp_array_get( $typography_supports, array( '__experimentalLetterSpacing' ), false );
	$has_line_height_support     = _wp_array_get( $typography_supports, array( 'lineHeight' ), false );
	$has_text_decoration_support = _wp_array_get( $typography_supports, array( '__experimentalTextDecoration' ), false );
	$has_text_transform_support  = _wp_array_get( $typography_supports, array( '__experimentalTextTransform' ), false );

	// Whether to skip individual block support features.
	$should_skip_font_size       = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'fontSize' );
	$should_skip_font_family     = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'fontFamily' );
	$should_skip_font_style      = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'fontStyle' );
	$should_skip_font_weight     = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'fontWeight' );
	$should_skip_line_height     = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'lineHeight' );
	$should_skip_text_decoration = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'textDecoration' );
	$should_skip_text_transform  = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'textTransform' );
	$should_skip_letter_spacing  = gutenberg_should_skip_block_supports_serialization( $block_type, 'typography', 'letterSpacing' );

	$typography_block_styles = array();
	if ( $has_font_size_support && ! $should_skip_font_size ) {
		$preset_font_size                    = array_key_exists( 'fontSize', $block_attributes ) ? "var:preset|font-size|{$block_attributes['fontSize']}" : null;
		$custom_font_size                    = isset( $block_attributes['style']['typography']['fontSize'] ) ? $block_attributes['style']['typography']['fontSize'] : null;
		$typography_block_styles['fontSize'] = $preset_font_size ? $preset_font_size : $custom_font_size;
	}

	if ( $has_font_family_support && ! $should_skip_font_family ) {
		$preset_font_family                    = array_key_exists( 'fontFamily', $block_attributes ) ? "var:preset|font-family|{$block_attributes['fontFamily']}" : null;
		$custom_font_family                    = isset( $block_attributes['style']['typography']['fontFamily'] ) ? gutenberg_typography_get_preset_inline_style_value( $block_attributes['style']['typography']['fontFamily'], 'font-family' ) : null;
		$typography_block_styles['fontFamily'] = $preset_font_family ? $preset_font_family : $custom_font_family;
	}

	if ( $has_font_style_support && ! $should_skip_font_style && isset( $block_attributes['style']['typography']['fontStyle'] ) ) {
		$typography_block_styles['fontStyle'] =
			gutenberg_typography_get_preset_inline_style_value( $block_attributes['style']['typography']['fontStyle'], 'font-style' );
	}

	if ( $has_font_weight_support && ! $should_skip_font_weight && isset( $block_attributes['style']['typography']['fontWeight'] ) ) {
		$typography_block_styles['fontWeight'] =
			gutenberg_typography_get_preset_inline_style_value( $block_attributes['style']['typography']['fontWeight'], 'font-weight' );
	}

	if ( $has_line_height_support && ! $should_skip_line_height ) {
			$typography_block_styles['lineHeight'] = _wp_array_get( $block_attributes, array( 'style', 'typography', 'lineHeight' ), null );
	}

	if ( $has_text_decoration_support && ! $should_skip_text_decoration && isset( $block_attributes['style']['typography']['textDecoration'] ) ) {
		$typography_block_styles['textDecoration'] =
			gutenberg_typography_get_preset_inline_style_value( $block_attributes['style']['typography']['textDecoration'], 'text-decoration' );
	}

	if ( $has_text_transform_support && ! $should_skip_text_transform && isset( $block_attributes['style']['typography']['textTransform'] ) ) {
		$typography_block_styles['textTransform'] =
			gutenberg_typography_get_preset_inline_style_value( $block_attributes['style']['typography']['textTransform'], 'text-transform' );
	}

	if ( $has_letter_spacing_support && ! $should_skip_letter_spacing && isset( $block_attributes['style']['typography']['letterSpacing'] ) ) {
		$typography_block_styles['letterSpacing'] =
			gutenberg_typography_get_preset_inline_style_value( $block_attributes['style']['typography']['letterSpacing'], 'letter-spacing' );
	}

	$attributes = array();
	$styles     = gutenberg_style_engine_generate( array( 'typography' => $typography_block_styles ) );

	if ( ! empty( $styles['classnames'] ) ) {
		$attributes['class'] = $styles['classnames'];
	}

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

/**
 * Note: this method is for backwards compatibility.
 * It mostly replaces `gutenberg_typography_get_css_variable_inline_style()`.
 *
 * Generates an inline style value for a typography feature e.g. text decoration,
 * text transform, and font style.
 *
 * @param string $style_value    A raw style value for a single typography feature from a block's style attribute.
 * @param string $css_property   Slug for the CSS property the inline style sets.
 *
 * @return string?             A CSS inline style value.
 */
function gutenberg_typography_get_preset_inline_style_value( $style_value, $css_property ) {
	// If the style value is not a preset CSS variable go no further.
	if ( empty( $style_value ) || strpos( $style_value, "var:preset|{$css_property}|" ) === false ) {
		return $style_value;
	}

	// For backwards compatibility.
	// Presets were removed in https://github.com/WordPress/gutenberg/pull/27555.
	// We have a preset CSS variable as the style.
	// Get the style value from the string and return CSS style.
	$index_to_splice = strrpos( $style_value, '|' ) + 1;
	$slug            = _wp_to_kebab_case( substr( $style_value, $index_to_splice ) );

	// Return the actual CSS inline style value e.g. `var(--wp--preset--text-decoration--underline);`.
	return sprintf( 'var(--wp--preset--%s--%s);', $css_property, $slug );
}

/**
 * Deprecated.
 * This method is no longer used and will have to be deprecated in Core.
 *
 * It can be deleted once migrated to the next WordPress version.
 *
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
	$style_value = _wp_array_get( $attributes, array( 'style', 'typography', $feature ), false );
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

function gutenberg_get_typography_font_size_value( $preset ) {
	// This is where we'll keep options I guess.
	// Comment out to show how things work.
	$typography_settings = gutenberg_get_global_settings( array( 'typography' ) );

//	if ( ! isset( $typography_settings['fluid'] ) ) {
//		return $preset['size'];
//	}

	// Should be defined by theme.json, maybe take from layout?
	$minimum_viewport_width = 640 / 16; // rem for now. 1200(px) / 16 to get rem.
	$maximum_viewport_width = 1600 / 16; // Ditto.

	/*
	Up next;
	 - Challenge: looping through fontSizes and calculating clamp functions for every size relies preferably on rem/px or unitless values.
	 - Apply this to custom font-size values.
	 */

	// Matches rem or unitless values only.
	$pattern = '/^(\d*\.?\d+)(rem|px)?$/';
	preg_match_all( $pattern, $preset['size'], $matches );

	if ( isset( $matches[1][0] ) ) {
		$base_value = intval( $matches[1][0] );

		if ( isset( $matches[2][0] ) && 'px' === $matches[2][0] ) {
			// Calculate rem to px.

			$base_value = $base_value / 16;
		}

		$minimum_font_size = $base_value * 1; // A min value should ideally be coming from theme.json.
		$maximum_font_size = $base_value * 1.5; // Ditto on the max.
		$factor            = ( 1 / ( $maximum_viewport_width - $minimum_viewport_width ) ) * ( $maximum_font_size - $minimum_font_size );
		$calc_rem          = $minimum_font_size - ( $minimum_viewport_width * $factor );
		$calc_vw           = 100 * $factor;
		$min               = min( $minimum_font_size, $maximum_font_size );
		$max               = max( $minimum_font_size, $maximum_font_size );

		return "clamp({$min}rem, {$calc_rem}rem + {$calc_vw}vw, {$max}rem)";

	} else {
		return $preset['size'];
	}
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'typography',
	array(
		'register_attribute' => 'gutenberg_register_typography_support',
		'apply'              => 'gutenberg_apply_typography_support',
	)
);
