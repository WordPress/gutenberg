<?php
/**
 * Plugin Name: Gutenberg Test Block Transforms
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Exposes the server-side HTML to blocks conversion over REST, so end-to-end
 * tests can compare what PHP produces with what the editor produces from the
 * same markup.
 *
 * @package gutenberg-test-block-transforms
 */

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'gutenberg-test/v1',
			'/html-to-blocks',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => static function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => array(
					'html' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
				'callback'            => static function ( WP_REST_Request $request ) {
					if ( ! function_exists( 'gutenberg_html_to_block_markup' ) ) {
						return new WP_Error(
							'gutenberg_test_conversion_unavailable',
							'This build of the Gutenberg plugin does not provide gutenberg_html_to_block_markup().',
							array( 'status' => 501 )
						);
					}

					return array(
						'markup' => gutenberg_html_to_block_markup( $request['html'] ),
					);
				},
			)
		);
	}
);
