<?php
/**
 * Preload paths for the block editor.
 *
 * @package gutenberg
 */

/**
 * Returns the paths that serve the fields of the given post types, skipping
 * the post types that are not registered.
 *
 * A path must match the request of the `getFieldsConfig` core data resolver,
 * see packages/core-data/src/resolvers.js.
 *
 * @param string[] $post_types The post types.
 * @return string[] One path of the `wp/v2/entity-fields` route per post type, in the
 *                  order the post types are given, without duplicates.
 */
function _gutenberg_get_post_type_fields_preload_paths( $post_types ) {
	$paths = array();
	foreach ( array_unique( $post_types ) as $post_type ) {
		if ( ! post_type_exists( $post_type ) ) {
			continue;
		}
		$paths[] = add_query_arg(
			array(
				'kind' => 'postType',
				'name' => $post_type,
			),
			'/wp/v2/entity-fields'
		);
	}

	return $paths;
}

/**
 * Returns the post types whose fields the screen of the site editor being
 * loaded lists, from its `p` query arg.
 *
 * The screens are the routes in
 * packages/edit-site/src/components/site-editor-routes: the lists and the
 * editors of pages, templates, patterns, and template parts. The patterns
 * screen lists both patterns and template parts.
 *
 * @return string[] The post types, empty for any other screen.
 */
function _gutenberg_get_site_editor_screen_post_types() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks what to preload.
	$path     = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '';
	$segments = explode( '/', trim( $path, '/' ) );

	switch ( $segments[0] ) {
		case 'page':
			return array( 'page' );
		case 'template':
		case 'wp_template':
			return array( 'wp_template' );
		case 'pattern':
			return array( 'wp_block', 'wp_template_part' );
		case 'wp_block':
			return array( 'wp_block' );
		case 'wp_template_part':
			return array( 'wp_template_part' );
	}
	return array();
}

/**
 * Preloads the fields of the post types the editors list.
 *
 * The editors read them from the `wp/v2/entity-fields` route, see `useFields`
 * in packages/editor/src/dataviews/fields-loader/index.ts. The post editor
 * reads those of the edited post in the post summary of its inspector. The
 * site editor reads those of the edited post, if any, and of the post types of
 * the screen it opens on.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function _gutenberg_preload_entity_fields( $paths, $context ) {
	$post_types = array();
	if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
		$post_types[] = $context->post->post_type;
	} elseif ( 'core/edit-site' === $context->name ) {
		if ( isset( $context->post ) ) {
			$post_types[] = $context->post->post_type;
		}
		$post_types = array_merge( $post_types, _gutenberg_get_site_editor_screen_post_types() );
	}

	return array_merge(
		$paths,
		_gutenberg_get_post_type_fields_preload_paths( $post_types )
	);
}
add_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_entity_fields', 10, 2 );

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
	// Complete list of fields expected by packages/core-data/src/entities.js.
	// The preloaded list must match entities.js exactly (same fields, same
	// order) or the browser discards the preloaded response, so any field
	// added to entities.js has to be reflected here too.
	// @see packages/core-data/src/entities.js rootEntitiesConfig.__unstableBase
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
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_2', 10, 2 );
