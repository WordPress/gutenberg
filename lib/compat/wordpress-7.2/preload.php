<?php
/**
 * Preload paths for client-side media processing.
 *
 * @package gutenberg
 */

/**
 * Adds the `generate_animated_image_subsizes` field to the preloaded root REST index.
 *
 * The preloaded `_fields` list has to match the one requested by
 * `packages/core-data/src/entities.js` exactly, same fields in the same order, or the
 * preloaded response is discarded and the editor requests the index again.
 *
 * @since 7.2.0
 *
 * @param array $paths REST API paths to preload.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_2( $paths ) {
	foreach ( $paths as $key => $path ) {
		if ( ! is_string( $path ) || ! str_starts_with( $path, '/?_fields=' ) ) {
			continue;
		}

		$fields = explode( ',', substr( $path, strlen( '/?_fields=' ) ) );

		if ( in_array( 'generate_animated_image_subsizes', $fields, true ) ) {
			break;
		}

		/*
		 * entities.js lists the field directly after `description`, and the
		 * 7.1 filter above builds a list that starts with it. Without that
		 * anchor there is no way to reproduce entities.js ordering here, and
		 * a list in any other order is simply ignored by the browser, so
		 * leave the path untouched rather than emit one that cannot match.
		 * Preloading is an optimization: a miss costs one extra request for
		 * the root index, never a wrong response.
		 */
		$position = array_search( 'description', $fields, true );

		if ( false === $position ) {
			break;
		}

		array_splice( $fields, $position + 1, 0, 'generate_animated_image_subsizes' );

		$paths[ $key ] = '/?_fields=' . implode( ',', $fields );
		break;
	}

	return $paths;
}
// Runs after the 7.1 filter, which replaces the field list wholesale.
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_2', 11 );
