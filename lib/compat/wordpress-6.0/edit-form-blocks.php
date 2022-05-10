<?php
/**
 * Patches resources loaded by the block editor page.
 *
 * @package gutenberg
 */

/**
 * Optimizes the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array $preload_paths Preload paths to be filtered.
 * @return array
 */
function gutenberg_optimize_preload_paths( $preload_paths ) {
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
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_optimize_preload_paths' );

/**
 * Disables loading remote block patterns from REST while initializing the editor.
 * Nowadays these loads are done in the `block-patterns/patterns` REST endpoint, and
 * are undesired when initializing the block editor page, both in post and site editor.
 *
 * @param WP_Screen $current_screen WordPress current screen object.
 */
function gutenberg_disable_load_remote_patterns( $current_screen ) {
	$is_site_editor = ( function_exists( 'gutenberg_is_edit_site_page' ) && gutenberg_is_edit_site_page( $current_screen->id ) );
	if ( $is_site_editor || $current_screen->is_block_editor() ) {
		add_filter( 'should_load_remote_block_patterns', '__return_false' );
	}
}
add_action( 'current_screen', 'gutenberg_disable_load_remote_patterns' );
