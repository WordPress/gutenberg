<?php

/**
 * Preload necessary resources for the editors.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Current block editor context
 *
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_6_9( $paths, $context ) {
	if ( 'core/edit-site' === $context->name ) {
		// Only prefetch for the root. If we preload it for all pages and it's not used
		// it won't be possible to invalidate.
		// To do: perhaps purge all preloaded paths when client side navigating.
		if ( isset( $_GET['p'] ) && '/' !== $_GET['p'] ) {
			$paths = array_filter(
				$paths,
				static function ( $path ) {
					return '/wp/v2/templates/lookup?slug=front-page' !== $path && '/wp/v2/templates/lookup?slug=home' !== $path;
				}
			);
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_9', 10, 2 );

/**
 * Preload bound single-resource GETs the post editor would otherwise
 * fetch post-mount.
 *
 * @param array                   $paths   REST API paths.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array
 */
function gutenberg_block_editor_preload_paths_post_editor_bound_gets( $paths, $context ) {
	if ( 'core/edit-post' !== $context->name || ! isset( $context->post ) ) {
		return $paths;
	}
	$paths[] = '/wp/v2/templates/lookup?slug=front-page';
	$paths[] = '/wp/v2/taxonomies?context=edit';
	$paths[] = array( '/wp/v2/posts', 'OPTIONS' );

	$author_id = (int) get_post_field( 'post_author', $context->post->ID );
	if ( $author_id ) {
		$paths[] = sprintf(
			'/wp/v2/users/%d?context=view&_fields=id,name',
			$author_id
		);
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_post_editor_bound_gets', 10, 2 );
