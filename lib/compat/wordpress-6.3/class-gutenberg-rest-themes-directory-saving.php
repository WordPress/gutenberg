<?php
/**
 * REST API: Gutenberg_REST_Themes_Directory_Saving class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for saving a theme to the database (theme.json, templates, parts).
 */
class Gutenberg_Rest_Themes_Directory_Saving extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp-block-editor/v2';
		$this->rest_base = 'themes-directory-saving';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 6.3.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_items' ),
					'permission_callback' => array( $this, 'update_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Updates the database.
	 *
	 * @since 6.3
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_items( $request ){
		$theme_slug = $request['theme_slug'];

		if ( ! is_string( $theme_slug ) ) {
			return new WP_Error( 'invalid_theme_slug', __( 'Invalid theme slug.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		$result = gutenberg_save_theme_to_database( $theme_slug );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( true );
	}

	public function update_items_permissions_check() {
		return current_user_can( 'edit_theme_options' );
	}

}