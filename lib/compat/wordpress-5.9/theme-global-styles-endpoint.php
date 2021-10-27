<?php
/**
 * Adds the global styles theme's endpoint.
 *
 * @package gutenberg
 */

/**
 * Retrieves the Global Styles for a given theme.
 *
 * @param WP_REST_Request $request Request object.
 *
 * @return WP_REST_Response $data
 */
function gutenberg_get_themes_global_styles( WP_REST_Request $request ) {
	if ( wp_get_theme()->get_stylesheet() !== $request['stylesheet'] ) {
		// This endpoint only supports the active theme for now.
		return new WP_Error(
			'rest_theme_not_found',
			__( 'Theme not found.', 'gutenberg' ),
			array( 'status' => 404 )
		);
	}

	$theme    = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( array(), 'theme' );
	$styles   = $theme->get_raw_data()['styles'];
	$settings = $theme->get_settings();
	$result   = array(
		'settings' => $settings,
		'styles'   => $styles,
	);

	$response = rest_ensure_response( $result );
	return $response;
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'wp/v2',
			'/themes/(?P<stylesheet>[\w-]+)/global-styles',
			array(
				'methods'             => 'GET',
				'callback'            => 'gutenberg_get_themes_global_styles',
				'permission_callback' => '__return_true',
			)
		);
	}
);
