<?php
/**
 * Guidelines REST API Controller.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for guideline posts.
 */
class Gutenberg_Guidelines_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Checks if a given request has access to read guideline posts.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type->cap->read ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view guidelines.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to read a guideline post.
	 *
	 * Guidelines are not public content, so every direct item read must pass
	 * the post-specific read capability before falling through to the standard
	 * post checks.
	 *
	 * @param WP_Post $post Post object.
	 * @return bool Whether the post can be read.
	 */
	public function check_read_permission( $post ) {
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}
}
