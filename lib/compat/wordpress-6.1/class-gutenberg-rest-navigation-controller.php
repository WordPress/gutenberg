<?php
/**
 * REST API: Gutenberg_REST_Navigation_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

class Gutenberg_REST_Navigation_Controller extends WP_REST_Posts_Controller {

	/**
	 * Overide WP_REST_Posts_Controller function to discard
	 * certain post statuses and treat as missing.
	 *
	 * @param int $id the ID of the Navigation post.
	 * @return WP_Post|null
	 */
	protected function get_post( $id ) {

		$result = parent::get_post( $id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$post = $result;

		if ( 'publish' === $post->post_status || 'draft' === $post->post_status ) {
			return $post;
		} else {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID.' ),
				array( 'status' => 404 )
			);
		}

	}
}
