<?php
/**
 * Rest Font Collections Controller.
 *
 * This file contains the class for the REST API Font Collections Controller.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( class_exists( 'WP_REST_Font_Collections_Controller' ) ) {
	return;
}

/**
 * Font Library Controller class.
 *
 * @since 6.5.0
 */
class WP_REST_Font_Collections_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 6.5.0
	 */
	public function __construct() {
		$this->rest_base = 'font-collections';
		$this->namespace = 'wp/v2';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 6.5.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_font_collections' ),
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\/\w-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_font_collection' ),
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Gets a font collection.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_font_collection( $request ) {
		$id         = $request->get_param( 'id' );
		$collection = WP_Font_Library::get_font_collection( $id );
		// If the collection doesn't exist returns a 404.
		if ( is_wp_error( $collection ) ) {
			$collection->add_data( array( 'status' => 404 ) );
			return $collection;
		}
		$collection_with_data = $collection->get_data();
		// If there was an error getting the collection data, return the error.
		if ( is_wp_error( $collection_with_data ) ) {
			$collection_with_data->add_data( array( 'status' => 500 ) );
			return $collection_with_data;
		}
		return new WP_REST_Response( $collection_with_data );
	}

	/**
	 * Gets the font collections available.
	 *
	 * @since 6.5.0
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_font_collections() {
		$collections = array();
		foreach ( WP_Font_Library::get_font_collections() as $collection ) {
			$collections[] = $collection->get_config();
		}

		return new WP_REST_Response( $collections, 200 );
	}

	/**
	 * Checks whether the user has permissions to update the Font Library.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the request has write access for the item, WP_Error object otherwise.
	 */
	public function update_font_library_permissions_check() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_update_font_library',
				__( 'Sorry, you are not allowed to update the Font Library on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}
		return true;
	}
}
