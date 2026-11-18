<?php
/**
 * Preload paths for the block editor.
 *
 * @package gutenberg
 */

/**
 * Scopes the preloaded autosaves path to the current user.
 *
 * `getAutosave` requests only the current user's autosave, and the preload
 * cache is keyed on the full path, so the preloaded path must match it.
 * WordPress 7.3 preloads this path itself, which this filter leaves as is.
 *
 * @since 7.3.0
 *
 * @see https://core.trac.wordpress.org/ticket/62057
 *
 * @param array<string|array<mixed>> $paths REST API paths to preload.
 * @return array<string|array<mixed>> Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_3( $paths ) {
	$user_id = get_current_user_id();
	if ( ! $user_id ) {
		return $paths;
	}

	foreach ( $paths as $key => $path ) {
		if ( is_string( $path ) && str_ends_with( $path, '/autosaves?context=edit' ) ) {
			$paths[ $key ] = add_query_arg( 'author', $user_id, $path );
			break;
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_3' );
