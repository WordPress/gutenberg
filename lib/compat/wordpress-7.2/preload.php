<?php
/**
 * Preload paths for the block editor.
 *
 * @package gutenberg
 */

/**
 * Filters the block editor preload paths.
 *
 * @since 7.2.0
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
			gutenberg_preload_post_summary_author( $author_id );
		}
	}

	// The site editor shows the same post summary for pages.
	if ( 'core/edit-site' === $context->name && isset( $context->post ) && 'page' === $context->post->post_type ) {
		$author_id = (int) get_post_field( 'post_author', $context->post->ID );
		if ( post_type_supports( 'page', 'author' ) && $author_id > 0 ) {
			gutenberg_preload_post_summary_author( $author_id );
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_2', 10, 2 );

/**
 * Preloads the author request of the post summary, which queries the users
 * collection with `who=authors` (see `AuthorView` in `core-fields`).
 *
 * `who` is deprecated in `WP_User_Query`, and preloading runs while the page
 * renders, so the notice would be printed into the page. REST requests report
 * it in a header instead, so it's silenced for this request.
 *
 * @param int $author_id The ID of the post author.
 */
function gutenberg_preload_post_summary_author( $author_id ) {
	// Priority 11, so removing it keeps one added at the default priority.
	add_filter( 'deprecated_argument_trigger_error', '__return_false', 11 );
	$preload_data = rest_preload_api_request( array(), sprintf( '/wp/v2/users?context=view&include[0]=%d&who=authors', $author_id ) );
	remove_filter( 'deprecated_argument_trigger_error', '__return_false', 11 );

	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
			wp_json_encode( $preload_data, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
		),
		'after'
	);
}
