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
	$attributes = gutenberg_apply_colors_support( $attributes, $block['attrs'], $block_type );
	$attributes = gutenberg_apply_typography_support( $attributes, $block['attrs'], $block_type );
	$attributes = gutenberg_apply_alignment_support( $attributes, $block['attrs'], $block_type );

	if ( ! count( $attributes ) ) {
		return $block_content;
	}

	$dom = new DOMDocument( '1.0', 'utf-8' );

	// Suppress warnings from this method from polluting the front-end.
	// @codingStandardsIgnoreStart
	if ( ! @$dom->loadHTML( mb_convert_encoding( $block_content, 'HTML-ENTITIES', 'UTF-8' ), LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_COMPACT ) ) {
	// @codingStandardsIgnoreEnd
		return $block_content;
	}

	$xpath      = new DOMXPath( $dom );
	$block_root = $xpath->query( '/*' )[0];

	if ( empty( $block_root ) ) {
		return $block_content;
	}

	// Some inline styles may be added without ending ';', add this if necessary.
	$current_styles = trim( $block_root->getAttribute( 'style' ), ' ' );
	if ( strlen( $current_styles ) > 0 && substr( $current_styles, -1 ) !== ';' ) {
		$current_styles = $current_styles . ';';
	};

	// Merge and dedupe new and existing classes and styles.
	$classes_to_add = esc_attr( implode( ' ', array_key_exists( 'css_classes', $attributes ) ? $attributes['css_classes'] : array() ) );
	$styles_to_add  = esc_attr( implode( ' ', array_key_exists( 'inline_styles', $attributes ) ? $attributes['inline_styles'] : array() ) );
	$new_classes    = implode( ' ', array_unique( explode( ' ', ltrim( $block_root->getAttribute( 'class' ) . ' ' ) . $classes_to_add ) ) );
	$new_styles     = implode( ' ', array_unique( explode( ' ', $current_styles . ' ' . $styles_to_add ) ) );

	// Apply new styles and classes.
	if ( ! empty( $new_classes ) ) {
		$block_root->setAttribute( 'class', $new_classes );
	}

	if ( ! empty( $new_styles ) ) {
		$block_root->setAttribute( 'style', $new_styles );
	}

	return mb_convert_encoding( $dom->saveHtml(), 'UTF-8', 'HTML-ENTITIES' );
}
add_filter( 'render_block', 'gutenberg_apply_block_supports', 10, 2 );
