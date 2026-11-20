<?php
/**
 * Shared helper function for marking taxonomy navigation items that contain the current post.
 *
 * @package WordPress
 */

/**
 * Returns the classes that mark a taxonomy navigation item as a parent or ancestor of the current post.
 *
 * Mirrors the classes that `wp_nav_menu()` adds to category menu items when viewing a single post:
 * the post's own terms get `current-menu-parent`, `current-{post_type}-parent` and
 * `current-{post_type}-ancestor`, while their ancestor terms get `current-{post_type}-ancestor`.
 * Like `wp_nav_menu()`, only hierarchical taxonomies and non-hierarchical post types are handled.
 *
 * @since 7.3.0
 *
 * @param array $attributes The block attributes.
 * @return string[] The classes to add to the navigation item.
 */
function block_core_shared_navigation_item_get_term_ancestor_classes( $attributes ) {
	$post = get_queried_object();
	if ( ! is_singular() || ! $post instanceof WP_Post || is_post_type_hierarchical( $post->post_type ) ) {
		return array();
	}

	// The taxonomy comes from the term, since the `type` attribute stores tags as `tag` and hyphens as underscores.
	$term = isset( $attributes['kind'], $attributes['id'] ) && 'taxonomy' === $attributes['kind'] ? get_term( (int) $attributes['id'] ) : null;
	if ( ! $term instanceof WP_Term || ! is_taxonomy_hierarchical( $term->taxonomy ) ) {
		return array();
	}

	$post_terms = get_the_terms( $post, $term->taxonomy );
	if ( ! is_array( $post_terms ) ) {
		return array();
	}

	$prefix = 'current-' . $post->post_type;

	if ( in_array( $term->term_id, wp_list_pluck( $post_terms, 'term_id' ), true ) ) {
		return array( 'current-menu-parent', $prefix . '-parent', $prefix . '-ancestor' );
	}

	foreach ( $post_terms as $post_term ) {
		if ( term_is_ancestor_of( $term, $post_term, $term->taxonomy ) ) {
			return array( $prefix . '-ancestor' );
		}
	}

	return array();
}
