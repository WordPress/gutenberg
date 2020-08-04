<?php
/**
 * Colors block support flag.
 *
 * @package gutenberg
 */

/**
 * Add CSS classes and inline styles for colors to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  array $attributes comprehensive list of attributes to be applied.
 * @param  array $block_attributes block attributes.
 * @param  array $block_type Block type.
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_apply_colors_support( $attributes, $block_attributes, $block_type ) {
	$has_text_colors_support       = $block_type->supports && array_key_exists( '__experimentalColor', $block_type->supports );
	$has_background_colors_support = $has_text_colors_support;
	$has_link_colors_support       = $has_text_colors_support && array_key_exists( 'linkColor', $block_type->supports['__experimentalColor'] );
	$has_gradients_support         = $has_text_colors_support && array_key_exists( 'gradients', $block_type->supports['__experimentalColor'] );

	// Text Colors.
	// Check support for text colors.
	if ( $has_text_colors_support ) {
		$has_named_text_color  = array_key_exists( 'textColor', $block_attributes );
		$has_custom_text_color = isset( $block_attributes['style']['color']['text'] );

		// Apply required generic class.
		if ( $has_custom_text_color || $has_named_text_color ) {
			$attributes['css_classes'][] = 'has-text-color';
		}
		// Apply color class or inline style.
		if ( $has_named_text_color ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-color', $block_attributes['textColor'] );
		} elseif ( $has_custom_text_color ) {
			$attributes['inline_styles'][] = sprintf( 'color: %s;', $block_attributes['style']['color']['text'] );
		}
	}

	// Link Colors.
	if ( $has_link_colors_support ) {
		$has_link_color = isset( $block_attributes['style']['color']['link'] );
		// Apply required class and style.
		if ( $has_link_color ) {
			$attributes['css_classes'][] = 'has-link-color';
			// If link is a named color.
			if ( strpos( $block_attributes['style']['color']['link'], 'var:preset|color|' ) !== false ) {
				// Get the name from the string and add proper styles.
				$index_to_splice               = strrpos( $block_attributes['style']['color']['link'], '|' ) + 1;
				$link_color_name               = substr( $block_attributes['style']['color']['link'], $index_to_splice );
				$attributes['inline_styles'][] = sprintf( '--wp--style--color--link:var(--wp--preset--color--%s);', $link_color_name );
			} else {
				$attributes['inline_styles'][] = sprintf( '--wp--style--color--link: %s;', $block_attributes['style']['color']['link'] );
			}
		}
	}

	// Background Colors.
	if ( $has_background_colors_support ) {
		$has_named_background_color  = array_key_exists( 'backgroundColor', $block_attributes );
		$has_custom_background_color = isset( $block_attributes['style']['color']['background'] );

		// Apply required background class.
		if ( $has_custom_background_color || $has_named_background_color ) {
			$attributes['css_classes'][] = 'has-background';
		}
		// Apply background color classes or styles.
		if ( $has_named_background_color ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-background-color', $block_attributes['backgroundColor'] );
		} elseif ( $has_custom_background_color ) {
			$attributes['inline_styles'][] = sprintf( 'background-color: %s;', $block_attributes['style']['color']['background'] );
		}
	}

	// Gradients.
	if ( $has_gradients_support ) {
		$has_named_gradient  = array_key_exists( 'gradient', $block_attributes );
		$has_custom_gradient = isset( $block_attributes['style']['color']['gradient'] );

		if ( $has_named_gradient || $has_custom_gradient ) {
			$attributes['css_classes'][] = 'has-background';
		}
		// Apply required background class.
		if ( $has_named_gradient ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-gradient-background', $block_attributes['gradient'] );
		} elseif ( $has_custom_gradient ) {
			$attributes['inline_styles'][] = sprintf( 'background: %s;', $block_attributes['style']['color']['gradient'] );
		}
	}

	return $attributes;
}
