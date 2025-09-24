<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Adds export theme link relation to the block theme responses.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Theme         $theme    Theme object used to create response.
 * @return WP_REST_Response Modified response object.
 */
function gutenberg_rest_theme_export_link_rel( $response, $theme ) {
	if ( ! empty( $response->get_links() ) && $theme->is_block_theme() ) {
		$response->add_link(
			'https://api.w.org/export-theme',
			rest_url( 'wp-block-editor/v1/export' ),
			array(
				'targetHints' => array(
					'allow' => current_user_can( 'export' ) ? array( 'GET' ) : array(),
				),
			)
		);
	}

	return $response;
}
add_filter( 'rest_prepare_theme', 'gutenberg_rest_theme_export_link_rel', 10, 2 );


/**
 * Overrides the REST controller for the `attachment` post type.
 *
 * @param array $args Array of arguments for registering a post type.
 *                          See the register_post_type() function for accepted arguments.
 *
 * @return array Array of arguments for registering a post type.
 */
function gutenberg_override_attachments_endpoint( array $args ): array {
	$args['rest_controller_class']   = 'Gutenberg_REST_Attachments_Controller';

	return $args;
}
add_filter( 'register_attachment_post_type_args', 'gutenberg_override_attachments_endpoint' );