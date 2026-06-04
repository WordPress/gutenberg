<?php
/**
 * Preload paths for client-side media processing.
 *
 * @package gutenberg
 */

/**
 * Filters the block editor preload paths to include media processing fields.
 *
 * The packages/core-data/src/entities.js file requests additional fields
 * (image_sizes, image_size_threshold) on the root endpoint that are not
 * included in WordPress Core's default preload paths. This filter ensures
 * the preloaded URL matches exactly what the JavaScript requests.
 *
 * @since 20.1.0
 *
 * @param array $paths REST API paths to preload.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_root_fields( $paths ) {
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

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_root_fields' );
