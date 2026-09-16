<?php
/**
 * REST API: WP_REST_Icon_Collections_Controller_Gutenberg class
 *
 * Changes to this class should be synced to the corresponding class in WordPress
 * core: src/wp-includes/rest-api/endpoints/class-wp-rest-icon-collections-controller.php.
 *
 * @package    gutenberg
 * @subpackage REST_API
 */

/**
 * Gutenberg Icon Collections REST API Controller.
 */
class WP_REST_Icon_Collections_Controller_Gutenberg extends WP_REST_Icon_Collections_Controller {
	/**
	 * Retrieves all icon collections, except the built-in one.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$response    = array();
		$collections = WP_Icon_Collections_Registry::get_instance()->get_all_registered();

		foreach ( $collections as $collection ) {
			if ( '_builtin' === ( $collection['slug'] ?? '' ) ) {
				continue;
			}
			$prepared_collection = $this->prepare_item_for_response( $collection, $request );
			$response[]          = $this->prepare_response_for_collection( $prepared_collection );
		}

		return rest_ensure_response( $response );
	}
}
