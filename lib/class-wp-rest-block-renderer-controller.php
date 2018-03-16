<?php
/**
 * Block Renderer REST API: WP_REST_Block_Renderer_Controller class
 *
 * @package gutenberg
 * @since ?
 */

/**
 * Controller which provides REST endpoint for rendering a block.
 *
 * @since ?
 *
 * @see WP_REST_Controller
 */
class WP_REST_Block_Renderer_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword.
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'block-renderer';
	}

	/**
	 * Registers the necessary REST API routes, one for each dynamic block.
	 *
	 * @access public
	 */
	public function register_routes() {
		$block_types = WP_Block_Type_Registry::get_instance()->get_all_registered();
		foreach ( $block_types as $block_type ) {
			if ( ! $block_type->is_dynamic() ) {
				continue;
			}

			// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword.
			register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<name>' . $block_type->name . ')', array(
				'args'   => array(
					'name' => array(
						'description' => __( 'Unique registered name for the block.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context'    => $this->get_context_param( array( 'default' => 'view' ) ),
						'attributes' => array(
							/* translators: %s is the name of the block */
							'description'          => sprintf( __( 'Attributes for %s block', 'gutenberg' ), $block_type->name ),
							'type'                 => 'object',
							'additionalProperties' => false,
							'properties'           => $block_type->attributes,
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			) );
		}
	}

	/**
	 * Checks if a given request has access to read blocks.
	 *
	 * @since ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'gutenberg_block_cannot_read', __( 'Sorry, you are not allowed to read Gutenberg blocks as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		return true;
	}

	/**
	 * Returns block output from block's registered render_callback.
	 *
	 * @since ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$registry = WP_Block_Type_Registry::get_instance();
		$block    = $registry->get_registered( $request['name'] );
		$data     = array(
			'rendered' => $block->render( $request->get_param( 'attributes' ) ),
		);
		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves block's output schema, conforming to JSON Schema.
	 *
	 * @since ?
	 * @access public
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/schema#',
			'title'      => 'rendered-block',
			'type'       => 'object',
			'properties' => array(
				'rendered' => array(
					'description' => __( 'The rendered block.', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
			),
		);
	}
}
