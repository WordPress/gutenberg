<?php
/**
 * Preload paths for client-side media processing.
 *
 * @package gutenberg
 */

/**
 * Filters the block editor preload paths.
 *
 * @since 20.1.0
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_1( $paths, $context ) {
	// Complete list of fields expected by packages/core-data/src/entities.js.
	// This must match exactly for preloading to work (same fields, same order).
	// @see packages/core-data/src/entities.js rootEntitiesConfig.__unstableBase
	$root_fields = 'description,gmt_offset,home,image_sizes,image_size_threshold,name,site_icon,site_icon_url,site_logo,timezone_string,url,page_for_posts,page_on_front,show_on_front';

	foreach ( $paths as $key => $path ) {
		if ( is_string( $path ) && str_starts_with( $path, '/?_fields=' ) ) {
			// Replace with the complete fields list to ensure exact match.
			$paths[ $key ] = '/?_fields=' . $root_fields;
			break;
		}
	}

	if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
		$paths[] = '/wp/v2/templates/lookup?slug=front-page';
		$paths[] = '/wp/v2/taxonomies?context=edit';
		$paths[] = array( rest_get_route_for_post_type_items( $context->post->post_type ), 'OPTIONS' );

		$author_id = (int) get_post_field( 'post_author', $context->post->ID );
		if ( post_type_supports( $context->post->post_type, 'author' ) && $author_id > 0 ) {
			$paths[] = sprintf(
				'/wp/v2/users/%d?context=view&_fields=id,name',
				$author_id
			);
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_1', 10, 2 );
