<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the block pattern directory.
 */
function gutenberg_register_rest_pattern_directory() {
	$block_directory_controller = new WP_REST_Pattern_Directory_Controller();
	$block_directory_controller->register_routes();
}
add_filter( 'rest_api_init', 'gutenberg_register_rest_pattern_directory' );

/**
 * Registers the menu locations area REST API routes.
 */
function gutenberg_register_rest_menu_location() {
	$nav_menu_location = new WP_REST_Menu_Locations_Controller();
	$nav_menu_location->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_menu_location' );

/**
 * Registers the menu locations area REST API routes.
 */
function gutenberg_register_rest_customizer_nonces() {
	$nav_menu_location = new WP_Rest_Customizer_Nonces();
	$nav_menu_location->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_customizer_nonces' );

/**
 * Registers the Sidebars & Widgets REST API routes.
 */
function gutenberg_register_sidebars_and_widgets_endpoint() {
	$sidebars = new WP_REST_Sidebars_Controller();
	$sidebars->register_routes();

	$widget_types = new WP_REST_Widget_Types_Controller();
	$widget_types->register_routes();
	$widgets = new WP_REST_Widgets_Controller();
	$widgets->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_sidebars_and_widgets_endpoint' );

/**
 * Registers the Batch REST API routes.
 */
function gutenberg_register_batch_endpoint() {
	$batch = new WP_REST_Batch_Controller();
	$batch->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_batch_endpoint' );

/**
 * Hook in to the nav menu item post type and enable a post type rest endpoint.
 *
 * @param array  $args Current registered post type args.
 * @param string $post_type Name of post type.
 *
 * @return array
 */
function wp_api_nav_menus_post_type_args( $args, $post_type ) {
	if ( 'nav_menu_item' === $post_type ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menu-items';
		$args['rest_controller_class'] = 'WP_REST_Menu_Items_Controller';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'wp_api_nav_menus_post_type_args', 10, 2 );

/**
 * Hook in to the nav_menu taxonomy and enable a taxonomy rest endpoint.
 *
 * @param array  $args Current registered taxonomy args.
 * @param string $taxonomy Name of taxonomy.
 *
 * @return array
 */
function wp_api_nav_menus_taxonomy_args( $args, $taxonomy ) {
	if ( 'nav_menu' === $taxonomy ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menus';
		$args['rest_controller_class'] = 'WP_REST_Menus_Controller';
	}

	return $args;
}
add_filter( 'register_taxonomy_args', 'wp_api_nav_menus_taxonomy_args', 10, 2 );

/**
 * Shim for get_sample_permalink() to add support for auto-draft status.
 *
 * This function filters the return from get_sample_permalink() and essentially
 * re-runs the same logic minus the filters, but pretends a status of auto-save
 * is actually publish in order to return the future permalink format.
 *
 * This is a temporary fix until we can patch get_sample_permalink()
 *
 * @see https://core.trac.wordpress.org/ticket/46266
 *
 * @param array  $permalink Array containing the sample permalink with placeholder for the post name, and the post name.
 * @param int    $id        ID of the post.
 * @param string $title     Title of the post.
 * @param string $name      Slug of the post.
 * @param object $post      WP_Post object.
 *
 * @return array Array containing the sample permalink with placeholder for the post name, and the post name.
 */
function gutenberg_auto_draft_get_sample_permalink( $permalink, $id, $title, $name, $post ) {
	if ( 'auto-draft' !== $post->post_status ) {
		return $permalink;
	}
	$ptype = get_post_type_object( $post->post_type );

	$original_status = $post->post_status;
	$original_date   = $post->post_date;
	$original_name   = $post->post_name;

	// Hack: get_permalink() would return ugly permalink for drafts, so we will fake that our post is published.
	$post->post_status = 'publish';
	$post->post_name   = sanitize_title( $post->post_name ? $post->post_name : $post->post_title, $post->ID );

	// If the user wants to set a new name -- override the current one.
	// Note: if empty name is supplied -- use the title instead, see #6072.
	if ( ! is_null( $name ) ) {
		$post->post_name = sanitize_title( $name ? $name : $title, $post->ID );
	}

	$post->post_name = wp_unique_post_slug( $post->post_name, $post->ID, $post->post_status, $post->post_type, $post->post_parent );

	$post->filter = 'sample';

	$permalink = get_permalink( $post, true );

	// Replace custom post_type Token with generic pagename token for ease of use.
	$permalink = str_replace( "%$post->post_type%", '%pagename%', $permalink );

	// Handle page hierarchy.
	if ( $ptype->hierarchical ) {
		$uri = get_page_uri( $post );
		if ( $uri ) {
			$uri = untrailingslashit( $uri );
			$uri = strrev( stristr( strrev( $uri ), '/' ) );
			$uri = untrailingslashit( $uri );
		}

		if ( ! empty( $uri ) ) {
			$uri .= '/';
		}
		$permalink = str_replace( '%pagename%', "{$uri}%pagename%", $permalink );
	}

	$permalink         = array( $permalink, $post->post_name );
	$post->post_status = $original_status;
	$post->post_date   = $original_date;
	$post->post_name   = $original_name;
	unset( $post->filter );

	return $permalink;
}
add_filter( 'get_sample_permalink', 'gutenberg_auto_draft_get_sample_permalink', 10, 5 );

/**
 * Registers the post format search handler.
 *
 * @param string $search_handlers     Title list of current handlers.
 *
 * @return array Title updated list of handlers.
 */
function gutenberg_post_format_search_handler( $search_handlers ) {
	if ( current_theme_supports( 'post-formats' ) ) {
		$search_handlers[] = new WP_REST_Post_Format_Search_Handler();
	}

	return $search_handlers;
}
add_filter( 'wp_rest_search_handlers', 'gutenberg_post_format_search_handler', 10, 5 );

/**
 * Registers the terms search handler.
 *
 * @param string $search_handlers Title list of current handlers.
 *
 * @return array Title updated list of handlers.
 */
function gutenberg_term_search_handler( $search_handlers ) {
	$search_handlers[] = new WP_REST_Term_Search_Handler();
	return $search_handlers;
}
add_filter( 'wp_rest_search_handlers', 'gutenberg_term_search_handler', 10, 5 );
