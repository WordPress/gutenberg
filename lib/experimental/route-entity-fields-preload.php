<?php
/**
 * Preload paths for the entity fields of the routes of the experimental pages:
 * the extensible site editor and the media editor.
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
 * Returns the post types whose fields the route being loaded lists or edits,
 * from its `p` query arg.
 *
 * The routes are the entry points in /routes whose screens make up the
 * extensible site editor and the media editor page. A route that shows no
 * post fields, such as `/styles`, contributes no post type. The paths without
 * a screen of their own (`/templates`, `/patterns`, `/types/<post type>`, …)
 * redirect client-side to their list route, and are what the menu items of
 * the page link to, so they preload what the list they land on needs.
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
 * Returns the paths of the view config the route being loaded resolves before
 * it renders.
 *
 * Only the media editor route does: its loader resolves the `form` of the
 * attachment view config, see routes/media-editor/route.ts. It is the only
 * route whose post type is `attachment`. A path must match the request of the
 * `getViewConfig` core data resolver, `_fields` included.
 *
 * @return string[] The paths of the `wp/v2/view-config` route, empty for any other route.
 */
function _gutenberg_get_route_view_config_preload_paths() {
	if ( array( 'attachment' ) !== _gutenberg_get_route_post_types() ) {
		return array();
	}

	return array( '/wp/v2/view-config?kind=postType&name=attachment&_fields=form' );
}

/**
 * Preloads the fields of the post types the route being loaded lists or edits,
 * and the view config it resolves before it renders.
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
	$paths = array_merge(
		_gutenberg_get_post_type_fields_preload_paths( _gutenberg_get_route_post_types() ),
		_gutenberg_get_route_view_config_preload_paths()
	);
	if ( empty( $paths ) ) {
		return;
	}

	// `rest_preload_api_request()` only keeps the responses that succeeded, so
	// an entity whose fields the current user cannot read leaves the request to the
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
