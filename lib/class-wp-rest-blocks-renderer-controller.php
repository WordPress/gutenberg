<?php
/**
 * Blocks Renderer REST API: WP_REST_Blocks_Renderer_Controller class
 *
 * @package gutenberg
 * @since ?
 */

/**
 * Controller which provides REST endpoint for rendering blocks.
 *
 * @since ?
 *
 * @see WP_REST_Controller
 */
class WP_REST_Blocks_Renderer_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {

		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword.
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'blocks-renderer';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {

		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword.
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<name>[\w-]+\/[\w-]+)', array(
			'args'   => array(
				'name' => array(
					'description' => __( 'Unique registered name for the block.', 'gutenberg' ),
					'type'        => 'string',
				),
			),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item_output' ),
				'permission_callback' => array( $this, 'get_item_output_permissions_check' ),
				'args'                => array(
					'context' => $this->get_context_param( array( 'default' => 'view' ) ),
				),
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );
	}

	/**
	 * Checks if a given request has access to read blocks.
	 *
	 * @since ?
	 * @access public
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_output_permissions_check() {
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
	public function get_item_output( $request ) {
		if ( ! isset( $request['name'] ) ) {
			return new WP_Error( 'rest_block_invalid_name', __( 'Invalid block name.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$registry = WP_Block_Type_Registry::get_instance();
		$block    = $registry->get_registered( $request['name'] );

		if ( ! $block || ! $block instanceof WP_Block_Type ) {
			return new WP_Error( 'rest_block_invalid_name', __( 'Invalid block name.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$atts = $this->prepare_attributes( $request->get_params() );

		$data = array(
			'output' => $block->render( $atts ),
		);
		return rest_ensure_response( $data );
	}

	/**
	 * Fix potential boolean value issues. The values come as strings and "false" and "true" might generate issues if left like this.
	 *
	 * @param array $attributes Attributes.
	 * @return mixed Attributes.
	 */
	public function prepare_attributes( $attributes ) {
		foreach ( $attributes as $key => $value ) {
			if ( 'false' === $value ) {
				$attributes[ $key ] = false;
			} elseif ( 'true' === $value ) {
				$attributes[ $key ] = true;
			}
		}

		return $attributes;
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
			'title'      => 'blocks-renderer',
			'type'       => 'object',
			'properties' => array(
				'output' => array(
					'description' => __( 'The block\'s output.', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
			),
		);
	}
}
