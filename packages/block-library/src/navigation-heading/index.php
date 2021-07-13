<?php
/**
 * Server-side rendering of the `core/navigation-heading` block.
 *
 * @package gutenberg
 */

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $context Navigation block context.
 * @return array Colors CSS classes and inline styles.
 */
function block_core_navigation_heading_build_css_colors( $context ) {
	$colors = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $context );
	$has_custom_text_color = isset( $context['style']['color']['text'] );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $context['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $context['style']['color']['text'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $context );
	$has_custom_background_color = isset( $context['style']['color']['background'] );

	// If has background color.
	if ( $has_custom_background_color || $has_named_background_color ) {
		// Add has-background class.
		$colors['css_classes'][] = 'has-background';
	}

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $context['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $context['style']['color']['background'] );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $context Navigation block context.
 * @return array Font size CSS classes and inline styles.
 */
function block_core_navigation_heading_build_css_font_sizes( $context ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $context );
	$has_custom_font_size = isset( $context['style']['typography']['fontSize'] );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $context['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $context['style']['typography']['fontSize'] );
	}

	return $font_sizes;
}

/**
 * Returns the top-level submenu SVG chevron icon.
 *
 * @return string
 */
function block_core_navigation_heading_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" role="img" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}

/**
 * Renders the `core/navigation-heading` block.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation_heading( $attributes, $content, $block ) {
	// Don't render the block's subtree if it has no label.
	if ( empty( $attributes['label'] ) ) {
		return '';
	}

	$colors          = block_core_navigation_heading_build_css_colors( $block->context );
	$font_sizes      = block_core_navigation_heading_build_css_font_sizes( $block->context );
	$classes         = array_merge(
		$colors['css_classes'],
		$font_sizes['css_classes']
	);
	$style_attribute = ( $colors['inline_styles'] . $font_sizes['inline_styles'] );

	$css_classes = trim( implode( ' ', $classes ) );
	$has_submenu = count( $block->inner_blocks ) > 0;

	$class_name = ! empty( $attributes['className'] ) ? implode( ' ', (array) $attributes['className'] ) : false;

	if ( false !== $class_name ) {
		$css_classes .= ' ' . $class_name;
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => $css_classes . ( $has_submenu ? ' has-child' : '' ),
			'style' => $style_attribute,
		)
	);
	$html               = '<li ' . $wrapper_attributes . '>' .
		'<span class="wp-block-navigation-link__content" tabindex="0">';

	// Start heading tag content.
	// Wrap title with span to isolate it from submenu icon.
	$html .= '<span class="wp-block-navigation-link__label">';
	
	if ( isset( $attributes['label'] ) ) {
		$html .= wp_kses(
			$attributes['label'],
			array(
				'code'   => array(),
				'em'     => array(),
				'img'    => array(
					'scale' => array(),
					'class' => array(),
					'style' => array(),
					'src'   => array(),
					'alt'   => array(),
				),
				's'      => array(),
				'span'   => array(
					'style' => array(),
				),
				'strong' => array(),
			)
		);
	}

	$html .= '</span>';

	if ( isset( $block->context['showSubmenuIcon'] ) && $block->context['showSubmenuIcon'] && $has_submenu ) {
		// The submenu icon can be hidden by a CSS rule on the Navigation Block.
		$html .= '<span class="wp-block-navigation-link__submenu-icon">' . block_core_navigation_heading_render_submenu_icon() . '</span>';
	}

	$html .= '</span>';
	// End heading tag content.

	if ( $has_submenu ) {
		$inner_blocks_html = '';
		foreach ( $block->inner_blocks as $inner_block ) {
			$inner_blocks_html .= $inner_block->render();
		}

		$html .= sprintf(
			'<ul class="wp-block-navigation-link__container">%s</ul>',
			$inner_blocks_html
		);
	}

	$html .= '</li>';

	return $html;
}

/**
 * Register the navigation heading block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation_heading() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-heading',
		array(
			'render_callback' => 'render_block_core_navigation_heading',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_heading' );
