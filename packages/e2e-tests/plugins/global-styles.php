<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Global Styles
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-global-styles
 */

/**
 * Add REST endpoint.
 */
function gutenberg_add_delete_all_global_styles_endpoint() {
	register_rest_route(
		'wp/v2',
		'/delete-all-global-styles',
		array(
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => function() {
					global $wpdb;
					$gs_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					$wpdb->get_results( "DELETE FROM {$wpdb->posts} WHERE post_type = 'wp_global_styles' AND id != {$gs_id}" );
					return rest_ensure_response( array( 'deleted' => true ) );
				},
				'permission_callback' => '__return_true',
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_add_delete_all_global_styles_endpoint' );
