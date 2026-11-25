<?php
/**
 * Plugin Name: Gutenberg Test Suggestion Raw Content
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Exposes a post's stored `post_content` exactly as it is in the database, so
 * an e2e test can check what readers without access to suggestions get. The
 * REST `content.raw` field cannot show it: the save pass re-inflates it with
 * the proposals for users who can read suggestions.
 *
 * @package gutenberg-test-suggestion-raw-content
 */

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'gutenberg-test/v1',
			'/suggestion-raw-content/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
				'callback'            => static function ( WP_REST_Request $request ) {
					global $wpdb;
					$post_id = (int) $request['id'];
					// Straight from the table, past every filter and cache.
					$content = $wpdb->get_var( $wpdb->prepare( "SELECT post_content FROM {$wpdb->posts} WHERE ID = %d", $post_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
					if ( null === $content ) {
						return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
					}
					return array( 'content' => $content );
				},
			)
		);
	}
);
