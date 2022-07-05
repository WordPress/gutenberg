<?php
/**
 * REST API: WP_REST_Custom_CSS_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for retrieving the Custom CSS.
 *
 * @see WP_REST_Controller
 */
class WP_REST_Custom_CSS_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		/*
		 * The rest base is different from the name of the post type,
		 * since it uses wp_get_custom_css().
		 */
		$this->rest_base = 'customcss';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see   register_rest_route()
	 *
	 * @since 6.1.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves the custom CSS
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$data = wp_get_custom_css();

		return rest_ensure_response( $data );
	}

	/**
	 * Update custom CSS
	 * @see https://developer.wordpress.org/reference/functions/wp_update_custom_css_post
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$data = wp_update_custom_css_post( $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks whether a given request has permission to read the custom CSS
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_css' ) ) {
			return new WP_Error( 'rest_cannot_view', __( 'Sorry, you are not allowed to view custom CSS.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Custom CSS schema
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'custom_css',
			'type'       => 'object',
			'properties' => array(
				'id'       => array(
					'description' => __( 'ID of the custom CSS.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'theme'        => array(
					'description' => __( 'The theme slug.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'content'        => array(
					'description' => __( 'The custom CSS provided by the user.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}
