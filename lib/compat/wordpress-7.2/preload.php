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
 * Preloads the fields of the post types the site editor lists.
 *
 * The site editor reads them from the `wp/v2/entity-fields` route before it
 * can list the post fields, see `useFields` in
 * packages/editor/src/dataviews/fields-loader/index.ts: those of the edited
 * post, if any, and of the post types of the screen it opens on.
 *
 * The post editor only reads them in the post summary of the DataForm-based
 * inspector, which is an experiment that preloads them on its own, see
 * lib/experimental/dataform-inspector-preload.php.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function _gutenberg_preload_entity_fields( $paths, $context ) {
	if ( 'core/edit-site' !== $context->name ) {
		return $paths;
	}

	$post_types = array();
	if ( isset( $context->post ) ) {
		$post_types[] = $context->post->post_type;
	}
	$post_types = array_merge( $post_types, _gutenberg_get_site_editor_screen_post_types() );

	return array_merge(
		$paths,
		_gutenberg_get_post_type_fields_preload_paths( $post_types )
	);
}
add_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_entity_fields', 10, 2 );
