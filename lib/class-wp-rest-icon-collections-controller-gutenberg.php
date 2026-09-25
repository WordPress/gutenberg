<?php
/**
 * REST API: Gutenberg icon collections controller.
 *
 * Changes to this class should be synced to the corresponding class
 * in WordPress core: src/wp-includes/rest-api/endpoints/class-wp-rest-icon-collections-controller.php.
 *
 * @package gutenberg
 * @subpackage REST_API
 */

/**
 * Gutenberg Icon Collections REST API Controller.
 *
 * @since 7.2.0
 */
class WP_REST_Icon_Collections_Controller_Gutenberg extends WP_REST_Icon_Collections_Controller {

	/**
	 * Retrieves all public icon collections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$response    = array();
		$collections = WP_Icon_Collections_Registry::get_instance()->get_all_registered();
		foreach ( $collections as $collection ) {
			if ( ! $collection['public'] ) {
				continue;
			}
			$prepared_collection = $this->prepare_item_for_response( $collection, $request );
			$response[]          = $this->prepare_response_for_collection( $prepared_collection );
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves a specific public icon collection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$collection = WP_Icon_Collections_Registry::get_instance()->get_registered( $request['slug'] );

		if ( null !== $collection && ! $collection['public'] ) {
			return new WP_Error(
				'rest_icon_collection_not_found',
				sprintf(
					/* translators: %s: Icon collection slug. */
					__( 'Icon collection not found: "%s".', 'gutenberg' ),
					$request['slug']
				),
				array( 'status' => 404 )
			);
		}

		return parent::get_item( $request );
	}
}
