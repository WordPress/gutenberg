<?php
/**
 * Server-side rendering of the `core/query-description` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-description` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the query description based on the queried object.
 */
function render_block_core_query_description( $attributes, $content, $block ) {

	// @see https://developer.wordpress.org/reference/functions/term_description/
	if ( is_tax() || is_tag() || is_category() ) {
		$term = get_queried_object();
		if ( $term ) {
			$term = $term->term_id;
		}
	}

	if ( ! isset( $term ) ) {
		return;
	}

	$description = get_term_field( 'description', $term );
	$tag_name           = 'div';
	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );
	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		$description
	);
}

/**
 * Registers the `core/query-description` block on the server.
 */
function register_block_core_query_description() {
	register_block_type_from_metadata(
		__DIR__ . '/query-description',
		array(
			'render_callback' => 'render_block_core_query_description',
		)
	);
}
add_action( 'init', 'register_block_core_query_description' );
