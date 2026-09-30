<?php
/**
 * Preload paths for the entity fields.
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
 * @return string[] One path of the `wp/v2/fields` route per post type, in the
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
			'/wp/v2/fields'
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
 * Preloads the fields of the post types the post editor or the site editor
 * lists.
 *
 * Both editors read them from the `wp/v2/fields` route before they can list
 * the post fields, see `registerPostTypeSchema` in
 * packages/editor/src/dataviews/store/private-actions.ts. The post editor
 * reads the fields of the edited post type; the site editor those of the
 * edited post, if any, and of the post types of the screen it opens on.
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

	return array_merge( $paths, _gutenberg_get_post_type_fields_preload_paths( $post_types ) );
}
add_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_entity_fields', 10, 2 );

/**
 * Returns the post types whose fields the route being loaded lists or edits,
 * from its `p` query arg.
 *
 * The routes are the entry points in /routes, whose screens make up the
 * extensible site editor and the media editor page. A route that shows no post
 * fields, such as `/styles`, contributes no post type. The paths without a
 * screen of their own (`/templates`, `/patterns`, `/types/<post type>`, …)
 * redirect client-side to their list route, and are what the menu items of the
 * page link to, so they preload what the list they land on needs.
 *
 * @return string[] The post types, empty for any other route.
 */
function _gutenberg_get_route_post_types() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks what to preload.
	$path = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '';
	// The router keeps the search of the route in `p`, as in `/types/page/list/all?page=2`.
	$path     = explode( '?', $path )[0];
	$segments = explode( '/', trim( $path, '/' ) );

	switch ( $segments[0] ) {
		case 'types':
			// `/types/<post type>` and its `list`, `edit`, and `new` routes.
			$post_type = isset( $segments[1] ) ? sanitize_key( $segments[1] ) : '';
			return '' === $post_type ? array() : array( $post_type );
		case 'templates':
			return array( 'wp_template' );
		case 'template-parts':
			return array( 'wp_template_part' );
		case 'patterns':
			return array( 'wp_block' );
		case 'navigation':
			return array( 'wp_navigation' );
		case 'media-editor':
			return array( 'attachment' );
	}
	return array();
}

/**
 * Preloads the fields of the post types the route being loaded lists or edits.
 *
 * A page booted by `@wordpress/boot` prints a preloading middleware of its own
 * with the paths every one of its routes needs, see the `page.php` template of
 * `@wordpress/build`. Which fields a screen needs depends on the route, which
 * that list cannot tell, so they are preloaded here as a second middleware:
 * `api-fetch` asks each middleware in turn, and one that does not hold the
 * path of a request passes it on.
 *
 * The `init` action of a page fires before the page prints its own preloaded
 * data, and `wp-api-fetch` is registered by then, so the inline script is
 * attached to the handle and printed along with it.
 */
function _gutenberg_preload_route_entity_fields() {
	$paths = _gutenberg_get_post_type_fields_preload_paths( _gutenberg_get_route_post_types() );
	if ( empty( $paths ) ) {
		return;
	}

	// `rest_preload_api_request()` only keeps the responses that succeeded, so
	// a post type the current user cannot read leaves the request to the
	// client rather than preloading the error.
	$preload_data = array_reduce( $paths, 'rest_preload_api_request', array() );
	if ( empty( $preload_data ) ) {
		return;
	}

	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
			wp_json_encode( $preload_data )
		),
		'after'
	);
}
add_action( 'site-editor-v2_init', '_gutenberg_preload_route_entity_fields' );
add_action( 'media-editor-wp-admin_init', '_gutenberg_preload_route_entity_fields' );
