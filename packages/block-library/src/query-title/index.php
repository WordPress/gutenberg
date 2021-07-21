<?php
/**
 * Server-side rendering of the `core/query-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-title` block on the server.
 * For now it supports Archive title, Search title and 404 title,
 * using queried object information
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the query title based on the queried object.
 */
function render_block_core_query_title( $attributes ) {
	$is_search  = is_search();
	$is_archive = is_archive();
	$is_404     = is_404();
	$title      = isset( $attributes['content'] ) ? $attributes['content'] : '';
	if ( $is_archive ) {
		$title = get_the_archive_title();
	} elseif ( $is_search ) {
		$title = isset( $attributes['searchTitleContent'] ) ? $attributes['searchTitleContent'] : '';
		global $wp_query;
		$formats      = array( '%total%', '%search%' );
		$replacements = array( $wp_query->found_posts, get_search_query() );
		$title        = str_replace( $formats, $replacements, $title );
	} elseif ( $is_404 ) {
		$title = isset( $attributes['nothingFoundTitleContent'] ) ? $attributes['nothingFoundTitleContent'] : '';
	}
	$tag_name           = isset( $attributes['level'] ) ? 'h' . (int) $attributes['level'] : 'h1';
	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );
	if ( 'Query title' === $title || empty( $title ) ) {
		return;
	}
	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		$title
	);
}

/**
 * Registers the `core/query-title` block on the server.
 */
function register_block_core_query_title() {
	register_block_type_from_metadata(
		__DIR__ . '/query-title',
		array(
			'render_callback' => 'render_block_core_query_title',
		)
	);
}
add_action( 'init', 'register_block_core_query_title' );
