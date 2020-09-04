<?php
/**
 * Block support flags.
 *
 * @package gutenberg
 */

/**
 * Filter the registered blocks to apply the block supports attributes registration.
 */
function gutenberg_register_block_supports() {
	$block_registry         = WP_Block_Type_Registry::get_instance();
	$registered_block_types = $block_registry->get_all_registered();
	// Ideally we need a hook to extend the block registration
	// instead of mutating the block type.
	foreach ( $registered_block_types as $block_type ) {
		gutenberg_register_alignment_support( $block_type );
		gutenberg_register_colors_support( $block_type );
		gutenberg_register_typography_support( $block_type );
		gutenberg_register_custom_classname_support( $block_type );
	}
}

add_action( 'init', 'gutenberg_register_block_supports', 21 );

/**
 * Filters the frontend output of blocks and apply the block support flags transformations.
 *
 * @param  string $block_content rendered block content.
 * @param  array  $block block object.
 * @return string filtered block content.
 */
function gutenberg_apply_block_supports( $block_content, $block ) {
	if ( ! isset( $block['attrs'] ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	// If no render_callback, assume styles have been previously handled.
	if ( ! $block_type || ! $block_type->render_callback ) {
		return $block_content;
	}

	$attributes = array();
	$attributes = gutenberg_apply_generated_classname_support( $attributes, $block['attrs'], $block_type );
	$attributes = gutenberg_apply_colors_support( $attributes, $block['attrs'], $block_type );
	$attributes = gutenberg_apply_typography_support( $attributes, $block['attrs'], $block_type );
	$attributes = gutenberg_apply_alignment_support( $attributes, $block['attrs'], $block_type );
	$attributes = gutenberg_apply_custom_classname_support( $attributes, $block['attrs'], $block_type );

	if ( ! count( $attributes ) ) {
		return $block_content;
	}

	// We need to wrap the block in order to handle UTF-8 properly.
	$wrapper_left  = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>';
	$wrapper_right = '</body></html>';

	$dom = new DOMDocument( '1.0', 'utf-8' );

	// Suppress DOMDocument::loadHTML warnings from polluting the front-end.
	$previous = libxml_use_internal_errors( true );

	$success = $dom->loadHTML( $wrapper_left . $block_content . $wrapper_right, LIBXML_HTML_NODEFDTD | LIBXML_COMPACT );

	// Clear errors and reset the use_errors setting.
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );

	if ( ! $success ) {
		return $block_content;
	}

	$xpath      = new DOMXPath( $dom );
	$block_root = $xpath->query( '/html/body/*' )[0];

	if ( empty( $block_root ) ) {
		return $block_content;
	}

	// Merge and dedupe new and existing classes and styles.
	$current_classes = explode( ' ', trim( $block_root->getAttribute( 'class' ) ) );
	$classes_to_add  = array_key_exists( 'css_classes', $attributes ) ? $attributes['css_classes'] : array();
	$new_classes     = array_unique( array_filter( array_merge( $current_classes, $classes_to_add ) ) );

	$current_styles = preg_split( '/\s*;\s*/', trim( $block_root->getAttribute( 'style' ) ) );
	$styles_to_add  = array_key_exists( 'inline_styles', $attributes ) ? $attributes['inline_styles'] : array();
	$new_styles     = array_unique( array_map( 'gutenberg_normalize_css_rule', array_filter( array_merge( $current_styles, $styles_to_add ) ) ) );

	// Apply new styles and classes.
	if ( ! empty( $new_classes ) ) {
		$block_root->setAttribute( 'class', esc_attr( implode( ' ', $new_classes ) ) );
	}

	if ( ! empty( $new_styles ) ) {
		$block_root->setAttribute( 'style', esc_attr( implode( '; ', $new_styles ) . ';' ) );
	}

	return $dom->saveHtml( $block_root );
}
add_filter( 'render_block', 'gutenberg_apply_block_supports', 10, 2 );

/**
 * Normalizes spacing in a string representing a CSS rule
 *
 * @example
 * 'color  :red;' becomes 'color:red'
 *
 * @param  string $css_rule_string CSS rule.
 * @return string Normalized CSS rule.
 */
function gutenberg_normalize_css_rule( $css_rule_string ) {
	return trim( implode( ': ', preg_split( '/\s*:\s*/', $css_rule_string, 2 ) ), ';' );
}
