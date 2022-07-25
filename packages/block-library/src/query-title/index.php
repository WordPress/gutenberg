<?php
/**
 * Server-side rendering of the `core/query-title` block.
 *
 * @package WordPress
 */

/**
 * Filters the prefix from the `core/query-title` block archive variation.
 *
 * @param array $title Archive title to be displayed.
 *
 * @return string Returns the query title based on the queried object but without prefix.
 */
function block_query_title_filter_archive_title( $title ) {
	if ( is_category() ) {
		return single_cat_title( '', false );
	} elseif ( is_tag() ) {
		return single_tag_title( '', false );
	} elseif ( is_author() ) {
		return get_the_author();
	} elseif ( is_post_type_archive() ) {
		return post_type_archive_title( '', false );
	} elseif ( is_tax() ) {
		return single_term_title( '', false );
	}
	return $title;
}

/**
 * Renders the `core/query-title` block on the server.
 * For now it only supports Archive title,
 * using queried object information
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the query title based on the queried object.
 */
function render_block_core_query_title( $attributes ) {
	$type       = isset( $attributes['type'] ) ? $attributes['type'] : null;
	$is_archive = is_archive();
	if ( ! $type || ( 'archive' === $type && ! $is_archive ) ) {
		return '';
	}
	$title = '';
	if ( $is_archive ) {
		$show_prefix = isset( $attributes['showPrefix'] ) ? $attributes['showPrefix'] : true;
		if ( ! $show_prefix ) {
			add_filter( 'get_the_archive_title', 'block_query_title_filter_archive_title' );
			$title = get_the_archive_title();
			remove_filter( 'get_the_archive_title', 'block_query_title_filter_archive_title' );
		} else {
			$title = get_the_archive_title();
		}
	}
	$tag_name           = isset( $attributes['level'] ) ? 'h' . (int) $attributes['level'] : 'h1';
	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );
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
