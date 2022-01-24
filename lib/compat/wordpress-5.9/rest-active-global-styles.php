<?php
/**
 * Extends the themes endpoint to add the global styles link.
 *
 * @package gutenberg
 */

/**
 * Adds the current global styles link to the theme's REST API response.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Theme         $theme    The theme object.
 */
function gutenberg_add_active_global_styles_link( $response, $theme ) {
	if ( $theme->get_stylesheet() === wp_get_theme()->get_stylesheet() ) {
		// This creates a record for the current theme if not existent.
		$id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	} else {
		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$id       = isset( $user_cpt['ID'] ) ? $user_cpt['ID'] : null;
	}

	if ( $id ) {
		$response->add_link(
			'https://api.w.org/user-global-styles',
			rest_url( 'wp/v2/global-styles/' . $id )
		);
	}

	return $response;
}

add_filter( 'rest_prepare_theme', 'gutenberg_add_active_global_styles_link', 10, 2 );
