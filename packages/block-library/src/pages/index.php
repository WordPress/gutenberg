<?php
/**
 * Server-side rendering of the `core/pages` block.
 *
 * @package WordPress
 */

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the pages markup in the front-end when it is a descendant of navigation.
 *
 * @param  array $context Navigation block context.
 * @return array Colors CSS classes and inline styles.
 */
function block_core_pages_build_css_colors( $context ) {
	$colors = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $context );
	$has_custom_text_color = array_key_exists( 'customTextColor', $context );

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
		$colors['inline_styles'] .= sprintf( 'color: %s;', $context['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $context );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $context );

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
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $context['customBackgroundColor'] );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the pages markup in the front-end when it is a descendant of navigation.
 *
 * @param  array $context Navigation block context.
 * @return array Font size CSS classes and inline styles.
 */
function block_core_pages_build_css_font_sizes( $context ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $context );
	$has_custom_font_size = array_key_exists( 'customFontSize', $context );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $context['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $context['customFontSize'] );
	}

	return $font_sizes;
}

/**
 * Renders the `core/pages` block on server.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the pages list/dropdown markup.
 */
function render_block_core_pages( $attributes, $content, $block ) {
	static $block_id = 0;
	$block_id++;

	$walker = new Walker_Pages_Block;

	$args = array(
		'echo'     => false,
		'title_li' => '',
		'walker'   => $walker,
	);

	$wrapper_markup = '<ul %1$s>%2$s</ul>';
	$items_markup   = wp_list_pages( $args );

	$colors          = block_core_pages_build_css_colors( $block->context );
	$font_sizes      = block_core_pages_build_css_font_sizes( $block->context );
	$classes         = array_merge(
		$colors['css_classes'],
		$font_sizes['css_classes']
	);
	$style_attribute = ( $colors['inline_styles'] || $font_sizes['inline_styles'] );
	$css_classes     = trim( implode( ' ', $classes ) );

	$css_classes .= ' wp-block-page-list';

	if ( $block->context && $block->context['showSubmenuIcon'] ) {
		$css_classes .= ' show-submenu-icons';
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => $css_classes,
			'style' => $style_attribute,
		)
	);

	return sprintf(
		$wrapper_markup,
		$wrapper_attributes,
		$items_markup
	);
}

/**
 * Registers the `core/pages` block on server.
 */
function register_block_core_pages() {
	register_block_type_from_metadata(
		__DIR__ . '/pages',
		array(
			'render_callback' => 'render_block_core_pages',
		)
	);
}
add_action( 'init', 'register_block_core_pages' );
