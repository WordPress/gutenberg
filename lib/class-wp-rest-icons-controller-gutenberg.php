<?php
/**
 * REST API: Bundle WP_Icons_Registry_Gutenberg class instead of inheriting per WordPress version class
 *
 * Changes to this class should be synced to the corresponding class
 * in WordPress core: src/wp-includes/rest-api/endpoints/class-wp-rest-icons-controller.php.
 *
 * @package    gutenberg
 * @subpackage REST_API
 */

/**
 * Gutenberg Icons REST API Controller.
 *
 * @since 7.1.0
 */
class WP_REST_Icons_Controller_Gutenberg extends WP_REST_Icons_Controller {

	/**
	 * Retrieves all icons, optionally filtered by collection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$collection = $request->get_param( 'collection' );

		if ( null !== $collection && ! WP_Icon_Collections_Registry::get_instance()->is_registered( $collection ) ) {
			return new WP_Error(
				'rest_icon_collection_not_found',
				sprintf(
					/* translators: %s: Icon collection slug. */
					__( 'Icon collection not found: "%s".', 'gutenberg' ),
					$collection
				),
				array( 'status' => 404 )
			);
		}

		$response = array();
		$search   = $request->get_param( 'search' );
		$icons    = WP_Icons_Registry::get_instance()->get_registered_icons( $search );

		foreach ( $icons as $icon ) {
			if ( null !== $collection && ( ! isset( $icon['collection'] ) || $icon['collection'] !== $collection ) ) {
				continue;
			}
			$prepared_icon = $this->prepare_item_for_response( $icon, $request );
			$response[]    = $this->prepare_response_for_collection( $prepared_icon );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves the query params for the icons collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['collection'] = array(
			'description' => __( 'Limit results to icons belonging to the given collection slug.', 'gutenberg' ),
			'type'        => 'string',
			'pattern'     => '^[a-z][a-z-]*$',
		);

		return $query_params;
	}
}
