<?php
/**
 * Extends the REST API endpoints.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the REST API routes for URL Details.
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
 * Hook in to the nav menu item post type and enable a post type rest endpoint.
 *
 * @param array  $args Current registered post type args.
 * @param string $post_type Name of post type.
 *
 * @return array
 */
function gutenberg_api_nav_menus_post_type_args( $args, $post_type ) {
	if ( 'nav_menu_item' === $post_type ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menu-items';
		$args['rest_controller_class'] = 'WP_REST_Menu_Items_Controller';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_api_nav_menus_post_type_args', 10, 2 );

/**
 * Hook in to the nav_menu taxonomy and enable a taxonomy rest endpoint.
 *
 * @param array  $args Current registered taxonomy args.
 * @param string $taxonomy Name of taxonomy.
 *
 * @return array
 */
function gutenberg_api_nav_menus_taxonomy_args( $args, $taxonomy ) {
	if ( 'nav_menu' === $taxonomy ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menus';
		$args['rest_controller_class'] = 'WP_REST_Menus_Controller';
	}

	return $args;
}
add_filter( 'register_taxonomy_args', 'gutenberg_api_nav_menus_taxonomy_args', 10, 2 );

/**
 * Exposes the site icon url to the Gutenberg editor through the WordPress REST
 * API. The site icon url should instead be fetched from the wp/v2/settings
 * endpoint when https://github.com/WordPress/gutenberg/pull/19967 is complete.
 *
 * @param WP_REST_Response $response Response data served by the WordPress REST index endpoint.
 * @return WP_REST_Response
 */
function gutenberg_register_site_icon_url( $response ) {
	$data                  = $response->data;
	$data['site_icon_url'] = get_site_icon_url();
	$response->set_data( $data );
	return $response;
}

add_filter( 'rest_index', 'gutenberg_register_site_icon_url' );

/**
 * Exposes the site logo to the Gutenberg editor through the WordPress REST
 * API. This is used for fetching this information when user has no rights
 * to update settings.
 *
 * @param WP_REST_Response $response Response data served by the WordPress REST index endpoint.
 * @return WP_REST_Response
 */
function gutenberg_register_site_logo_to_rest_index( $response ) {
	$site_logo_id                = get_theme_mod( 'custom_logo' );
	$response->data['site_logo'] = $site_logo_id;
	if ( $site_logo_id ) {
		$response->add_link(
			'https://api.w.org/featuredmedia',
			rest_url( 'wp/v2/media/' . $site_logo_id ),
			array(
				'embeddable' => true,
			)
		);
	}
	return $response;
}

add_filter( 'rest_index', 'gutenberg_register_site_logo_to_rest_index' );

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
