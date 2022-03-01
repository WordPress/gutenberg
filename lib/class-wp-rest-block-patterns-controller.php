<?php
/**
 * REST API: WP_REST_Block_Patterns_Controller class
 *
 * @subpackage REST_API
 * @package    WordPress
 */

/**
 * Core class used to access block patterns via the REST API.
 *
 * @see   WP_REST_Controller
 */
class WP_REST_Block_Patterns_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'block-patterns';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see   register_rest_route()
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
				'schema'      => array( $this, 'get_public_item_schema' ),
				'allow_batch' => array( 'v1' => true ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read navigation areas.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_view',
			__( 'Sorry, you are not allowed to view the registered block patterns.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieves all block patterns.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items() {
		$data = WP_Block_Patterns_Registry::get_instance()->get_all_registered();
		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the block pattern schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-pattern',
			'type'       => 'object',
			'properties' => array(
				'title'      => array(
					'description' => __( 'The title of the block pattern.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'name'       => array(
					'description' => __( 'The name of the block pattern.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'blockTypes' => array(
					'description' => __( 'Block types that the pattern is intended to be used with.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
				),
				'categories' => array(
					'description' => __( 'Categories that the block pattern belongs to.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
				),
				'content'    => array(
					'description' => __( 'Block HTML Markup for the pattern.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}
