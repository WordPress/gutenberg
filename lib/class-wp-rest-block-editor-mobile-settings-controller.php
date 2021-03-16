<?php
/**
 * REST API: WP_REST_Block_Editor_Mobile_Settings_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Core class used to retrieve block editor settings via the REST API.
 *
 * @see WP_REST_Controller
 */
class WP_REST_Block_Editor_Mobile_Settings_Controller extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'block-editor-mobile-settings';
	}

	/**
	 * Registers the necessary REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read block editor settings
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_posts' ) ) {
			$error = __( 'Sorry, you are not allowed to read the block editor settings.', 'gutenberg' );
			return new WP_Error( 'rest_cannot_read_settings', $error, array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Return all block editor settings
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$settings = apply_filters( 'block_editor_settings_mobile', array() );

		return rest_ensure_response( $settings );
	}
}
