<?php
/**
 * Server-side rendering of the `core/term-count` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/term-count` block on the server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the count of the current taxonomy term wrapped inside a heading tag.
 */
function render_block_core_term_count( $attributes, $content, $block ) {
	$term_count = '';

	// Get term from context or from the current query.
	if ( isset( $block->context['termId'] ) && isset( $block->context['taxonomy'] ) ) {
		$term = get_term( $block->context['termId'], $block->context['taxonomy'] );
	} else {
		$term = get_queried_object();
		if ( ! $term instanceof WP_Term ) {
			$term = null;
		}
	}

	if ( ! $term || is_wp_error( $term ) ) {
		return '';
	}

	$term_count = $term->count;
	$tag_name   = isset( $attributes['tagName'] ) ? $attributes['tagName'] : 'p';

	if ( isset( $attributes['hasParenthesis'] ) && $attributes['hasParenthesis'] ) {
		$term_count = sprintf(
			'(%d)',
			$term_count
		);
	}

	$classes = array();
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		$term_count
	);
}

/**
 * Registers the `core/term-count` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_term_count() {
	register_block_type_from_metadata(
		__DIR__ . '/term-count',
		array(
			'render_callback' => 'render_block_core_term_count',
		)
	);
}
add_action( 'init', 'register_block_core_term_count' );
