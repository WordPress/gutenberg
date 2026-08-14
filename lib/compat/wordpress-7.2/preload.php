<?php
/**
 * Preload paths for the block editor.
 *
 * @package gutenberg
 */

/**
 * Scopes the preloaded autosaves path to the current user.
 *
 * Core preloads the whole autosave collection for the post, but the editor
 * only ever reads the current user's autosave, so `getAutosave` requests that
 * one record. The preload cache is keyed on the requested path, so the two
 * have to agree: without this the preloaded entry goes unused and the editor
 * makes a network request for something it was already handed.
 *
 * WordPress ignores query parameters an endpoint has not registered, so on a
 * version without `author` support this preloads the same collection it does
 * today, under the path the editor asks for.
 *
 * @since 23.8.0
 *
 * @see https://core.trac.wordpress.org/ticket/62057
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_2( $paths, $context ) {
	unset( $context );

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
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_2', 10, 2 );
