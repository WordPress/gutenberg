<?php
/**
 * Reusable Blocks REST API: WP_REST_Reusable_Blocks_Controller class
 *
 * @package gutenberg
 * @since 0.10.0
 */

/**
 * Controller which allows Gutenberg reusable blocks to be read, created and edited via a REST API.
 *
 * @since 0.10.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Reusable_Blocks_Controller extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 *
	 * @since 0.10.0
	 * @access public
	 */
	public function __construct() {
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'reusable-blocks';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 0.10.0
	 * @access public
	 */
	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_item' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
				'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );
	}

	/**
	 * Checks if a given request has access to read a reusable block.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		// TODO: Implement this.
		return true;
	}

	/**
	 * Retrieves a single reusable block.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		return rest_ensure_response( array(
			'id' => $request['id'],
		) );
	}

	/**
	 * Checks if a given request has access to update a reusable block.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		// TODO: Implement this.
		return true;
	}

	/**
	 * Updates a single reusable block.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		return rest_ensure_response( array(
			'id' => $request['id'],
			'type' => $request['type'],
			'attributes' => $request['attributes'],
			'content' => $request['content'],
		) );
	}

	/**
	 * Retrieves a reusable block's schema, conforming to JSON Schema.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'              => 'http://json-schema.org/schema#',
			'title'                => 'reusable-block',
			'type'                 => 'object',
			'properties'           => array(
				'id'               => array(
					'description'  => __( 'UUID that identifies this reusable block.', 'gutenberg' ),
					'type'         => 'string',
					'context'      => array( 'view', 'edit' ),
					'readonly'     => true,
				),
				'type'             => array(
					'description'  => __( 'The block\'s type, e.g. core/text', 'gutenberg' ),
					'type'         => 'string',
					'context'      => array( 'view', 'edit' ),
					'required'     => true,
				),
				'attributes'       => array(
					'description'  => __( 'The block\'s attributes, e.g. { "dropCap": true }', 'gutenberg' ),
					'type'         => 'object',
					'context'      => array( 'view', 'edit' ),
					'required'     => true,
				),
				'content'          => array(
					'description'  => __( 'The block\'s HTML content.', 'gutenberg' ),
					'type'         => 'object',
					'context'      => array( 'view', 'edit' ),
					'required'     => true,
				),
			),
		);
	}
}
