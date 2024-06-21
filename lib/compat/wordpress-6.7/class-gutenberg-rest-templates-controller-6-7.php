<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_7 class
 *
 * @package    gutenberg
 */

/**
 * Gutenberg_REST_Templates_Controller_6_7 class
 */
class Gutenberg_REST_Templates_Controller_6_7 extends Gutenberg_REST_Templates_Controller_6_6 {
	/**
	 * Add revisions to the response.
	 *
	 * @param WP_Block_Template $item    Template instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$template = $item;

		$response = parent::prepare_item_for_response( $item, $request );

		/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		return apply_filters( "rest_prepare_{$this->post_type}", $response, $template, $request );
	}
}
