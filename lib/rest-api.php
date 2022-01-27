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
 * Registers the REST API routes for URL Details.
 *
 * @since 5.0.0
 */
function gutenberg_register_url_details_routes() {
	$url_details_controller = new WP_REST_URL_Details_Controller();
	$url_details_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_url_details_routes' );

/**
 * Registers the menu locations REST API routes.
 */
function gutenberg_register_rest_menu_location() {
	$nav_menu_location = new WP_REST_Menu_Locations_Controller();
	$nav_menu_location->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_menu_location' );

/**
 * Registers the navigation areas REST API routes.
 */
function gutenberg_register_rest_navigation_areas() {
	$navigation_areas = new WP_REST_Block_Navigation_Areas_Controller();
	$navigation_areas->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_navigation_areas' );

/**
 * Registers the customizer nonces REST API routes.
 */
function gutenberg_register_rest_customizer_nonces() {
	$customizer_nonces = new WP_Rest_Customizer_Nonces();
	$customizer_nonces->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_customizer_nonces' );

/**
 * Registers the Sidebars & Widgets REST API routes.
 */
function gutenberg_register_sidebars_and_widgets_endpoint() {
	$widgets = new WP_REST_Widgets_Controller();
	$widgets->register_routes();

	$widget_types = new WP_REST_Widget_Types_Controller();
	$widget_types->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_sidebars_and_widgets_endpoint' );

/**
 * Registers the Block editor settings REST API routes.
 */
function gutenberg_register_block_editor_settings() {
	$editor_settings = new WP_REST_Block_Editor_Settings_Controller();
	$editor_settings->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_block_editor_settings' );

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
 * Filters WP_User_Query arguments when querying users via the REST API.
 *
 * Allow using the has_published_post argument.
 *
 * @param array           $prepared_args Array of arguments for WP_User_Query.
 * @param WP_REST_Request $request       The REST API request.
 *
 * @return array Returns modified $prepared_args.
 */
function gutenberg_rest_user_query_has_published_posts( $prepared_args, $request ) {
	if ( ! empty( $request['has_published_posts'] ) ) {
		$prepared_args['has_published_posts'] = ( true === $request['has_published_posts'] )
			? get_post_types( array( 'show_in_rest' => true ), 'names' )
			: (array) $request['has_published_posts'];
	}
	return $prepared_args;
}
add_filter( 'rest_user_query', 'gutenberg_rest_user_query_has_published_posts', 10, 2 );


/**
 * Filters REST API collection parameters for the users controller.
 *
 * @param array $query_params JSON Schema-formatted collection parameters.
 *
 * @return array Returns the $query_params with "has_published_posts".
 */
function gutenberg_rest_user_collection_params_has_published_posts( $query_params ) {
	$query_params['has_published_posts'] = array(
		'description' => __( 'Limit result set to users who have published posts.', 'gutenberg' ),
		'type'        => array( 'boolean', 'array' ),
		'items'       => array(
			'type' => 'string',
			'enum' => get_post_types( array( 'show_in_rest' => true ), 'names' ),
		),
	);
	return $query_params;
}
add_filter( 'rest_user_collection_params', 'gutenberg_rest_user_collection_params_has_published_posts' );

/**
 * Registers the Edit Site's Export REST API routes.
 *
 * @return void
 */
function gutenberg_register_edit_site_export_endpoint() {
	$editor_settings = new WP_REST_Edit_Site_Export_Controller();
	$editor_settings->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_edit_site_export_endpoint' );
