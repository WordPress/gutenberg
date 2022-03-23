<?php
/**
 * Patches preload paths for post editor.
 *
 * @package gutenberg
 */

/**
 * Optimizes the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array $preload_paths Preload paths to be filtered.
 * @return array
 */
function optimize_preload_paths( $preload_paths ) {
	// remove preload of the `/` route.
	$root_index = array_search( '/', $preload_paths, true );
	if ( false !== $root_index ) {
		array_splice( $preload_paths, $root_index, 1 );
	}

	// change `/types` context from `edit` to `view` (requested in `loadPostTypeEntities`).
	$types_index = array_search( '/wp/v2/types?context=edit', $preload_paths, true );
	if ( false !== $types_index ) {
		$preload_paths[ $types_index ] = '/wp/v2/types?context=view';
	}

	// start preloading `/taxonomies` in `view` context (requested in `loadTaxonomyEntities`).
	$tax_index = array_search( '/wp/v2/taxonomies?per_page=-1&context=edit', $preload_paths, true );
	if ( false === $tax_index ) {
		array_push( $preload_paths, '/wp/v2/taxonomies?context=view' );
	} else {
		$preload_paths[ $tax_index ] = '/wp/v2/taxonomies?context=view';
	}

	// start preloading `/settings`.
	$settings_index = array_search( '/wp/v2/settings', $preload_paths, true );
	if ( false === $settings_index ) {
		array_push( $preload_paths, '/wp/v2/settings' );
	}

	// modify the preload of `/users/me` to match the real request.
	foreach ( $preload_paths as $user_index => $user_path ) {
		if ( is_string( $user_path ) && 0 === strpos( $user_path, '/wp/v2/users/me' ) ) {
			$preload_paths[ $user_index ] = '/wp/v2/users/me';
			break;
		}
	}

	return $preload_paths;
}

add_filter( 'block_editor_rest_api_preload_paths', 'optimize_preload_paths' );
