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
	 * Retrieves all icons.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$response = array();
		$search   = $request->get_param( 'search' );
		$icons    = WP_Icons_Registry::get_instance()->get_registered_icons( $search );
		foreach ( $icons as $icon ) {
			if ( empty( $icon['show_in_rest'] ) ) {
				continue;
			}
			$prepared_icon = $this->prepare_item_for_response( $icon, $request );
			$response[]    = $this->prepare_response_for_collection( $prepared_icon );
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves a specific icon from the registry.
	 *
	 * @param string $name Icon name.
	 * @return array|WP_Error Icon data on success, or WP_Error object on failure.
	 */
	public function get_icon( $name ) {
		$icon = parent::get_icon( $name );

		if ( ! is_wp_error( $icon ) && empty( $icon['show_in_rest'] ) ) {
			return new WP_Error(
				'rest_icon_not_found',
				sprintf(
					// translators: %s is the name of any user-provided name
					__( 'Icon not found: "%s".', 'gutenberg' ),
					$name
				),
				array( 'status' => 404 )
			);
		}

		return $icon;
	}
}
