<?php
/**
 * Preload paths for the block editor.
 *
 * @package gutenberg
 */

/**
 * Filters the block editor preload paths.
 *
 * Also scopes the preloaded autosaves path to the current user. Core preloads
 * the whole autosave collection for the post, but the editor only ever reads
 * the current user's autosave, so `getAutosave` requests that one record. The
 * preload cache is keyed on the requested path, so the two have to agree.
 * WordPress ignores query parameters an endpoint has not registered, so on a
 * version without `author` support this preloads the same collection under
 * the path the editor asks for.
 *
 * @since 7.2.0
 *
 * @see https://core.trac.wordpress.org/ticket/62057
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_2( $paths, $context ) {
	// Complete list of fields expected by packages/core-data/src/entities.ts.
	// The preloaded list must match entities.js exactly (same fields, same
	// order) or the browser discards the preloaded response, so any field
	// added to entities.js has to be reflected here too.
	// @see packages/core-data/src/entities.ts rootEntitiesConfig.__unstableBase
	$root_fields = 'description,generate_animated_image_subsizes,gmt_offset,home,image_max_bit_depth,image_sizes,image_size_threshold,image_strip_meta,name,site_icon,site_icon_url,site_logo,timezone_string,url,page_for_posts,page_on_front,show_on_front';

	foreach ( $paths as $key => $path ) {
		if ( is_string( $path ) && str_starts_with( $path, '/?_fields=' ) ) {
			// Replace with the complete fields list to ensure exact match.
			$paths[ $key ] = '/?_fields=' . $root_fields;
			break;
		}
	}

	$user_id = get_current_user_id();
	if ( $user_id ) {
		foreach ( $paths as $key => $path ) {
			if ( is_string( $path ) && str_ends_with( $path, '/autosaves?context=edit' ) ) {
				$paths[ $key ] = add_query_arg( 'author', $user_id, $path );
				break;
			}
		}
	}

	if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
		$paths[] = '/wp/v2/templates/lookup?slug=front-page';
		$paths[] = '/wp/v2/taxonomies?context=edit';
		$paths[] = array( rest_get_route_for_post_type_items( $context->post->post_type ), 'OPTIONS' );
		// The post summary of the inspector requests the form config of the
		// post type through `useViewConfig` with `fields: [ 'form' ]`, so the
		// path must match the resulting `_fields=form` request.
		$paths[] = '/wp/v2/view-config?kind=postType&name=' . $context->post->post_type . '&_fields=form';

		$author_id = (int) get_post_field( 'post_author', $context->post->ID );
		if ( post_type_supports( $context->post->post_type, 'author' ) && $author_id > 0 ) {
			// Core preloads the single user path of the classic author panel,
			// which nothing requests anymore.
			$classic_author_path = sprintf( '/wp/v2/users/%d?context=view&_fields=id,name', $author_id );
			$paths               = array_values(
				array_filter(
					$paths,
					static function ( $path ) use ( $classic_author_path ) {
						return $path !== $classic_author_path;
					}
				)
			);
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_2', 10, 2 );
