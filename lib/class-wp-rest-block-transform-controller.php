<?php

/**
 * Block Transform REST API: WP_REST_Block_Transform_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since ?.?.0
 */

/**
 * Controller which provides REST endpoint for transforming a block.
 *
 * @since ?.?.?
 *
 * @see WP_REST_Controller
 */
class WP_REST_Block_Transform_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @since ?.?.?
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'block-transform';
	}

	/**
	 * Registers the necessary REST API routes, one for each dynamic block that has a transform callback.
	 *
	 * @since ?.?.?
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<name>[a-z0-9-]+/[a-z0-9-]+)',
			array(
				'args'   => array(
					'name' => array(
						'description' => __( 'Unique registered name for the block.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => array( WP_REST_Server::READABLE, WP_REST_Server::CREATABLE ),
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context'    => $this->get_context_param( array( 'default' => 'view' ) ),
						'attributes' => array(
							'description'       => __( 'Attributes for the block.', 'gutenberg' ),
							'type'              => 'object',
							'default'           => array(),
							'validate_callback' => static function ( $value, $request ) {
								$block = WP_Block_Type_Registry::get_instance()->get_registered( $request['name'] );

								if ( ! $block ) {
									// This will get rejected in ::get_item().
									return true;
								}

								$schema = array(
									'type'                 => 'object',
									'properties'           => $block->get_attributes(),
									'additionalProperties' => false,
								);

								return rest_validate_value_from_schema( $value, $schema );
							},
							'sanitize_callback' => static function ( $value, $request ) {
								$block = WP_Block_Type_Registry::get_instance()->get_registered( $request['name'] );

								if ( ! $block ) {
									// This will get rejected in ::get_item().
									return true;
								}

								$schema = array(
									'type'                 => 'object',
									'properties'           => $block->get_attributes(),
									'additionalProperties' => false,
								);

								return rest_sanitize_value_from_schema( $value, $schema );
							},
						),
						'post_id'    => array(
							'description' => __( 'ID of the post context.', 'gutenberg' ),
							'type'        => 'integer',
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read blocks.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 * @since ?.?.?
	 */
	public function get_item_permissions_check( $request ) {
		global $post;

		$post_id = isset( $request['post_id'] ) ? (int) $request['post_id'] : 0;

		if ( 0 < $post_id ) {
			$post = get_post( $post_id );

			if ( ! $post || ! current_user_can( 'edit_post', $post->ID ) ) {
				return new WP_Error(
					'block_cannot_read',
					__( 'Sorry, you are not allowed to read blocks of this post.', 'gutenberg' ),
					array(
						'status' => rest_authorization_required_code(),
					)
				);
			}
		} else {
			if ( ! current_user_can( 'edit_posts' ) ) {
				return new WP_Error(
					'block_cannot_read',
					__( 'Sorry, you are not allowed to read blocks as this user.', 'gutenberg' ),
					array(
						'status' => rest_authorization_required_code(),
					)
				);
			}
		}

		return true;
	}

	/**
	 * Returns block output from block's registered transform_callback.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 * @since ?.?.?
	 */
	public function get_item( $request ) {
		global $post;

		$post_id = isset( $request['post_id'] ) ? (int) $request['post_id'] : 0;

		if ( 0 < $post_id ) {
			$post = get_post( $post_id );

			// Set up postdata since this will be needed if post_id was set.
			setup_postdata( $post );
		}

		$registry   = WP_Block_Type_Registry::get_instance();
		$registered = $registry->get_registered( $request['name'] );

		$registered_is_null           = null === $registered;
		$block_api_supports_transform = method_exists( $registered, 'has_dynamic_transform' );

		if ( $registered_is_null || ! $block_api_supports_transform || ! $registered->has_dynamic_transform() ) {
			return new WP_Error(
				'block_invalid',
				__( 'No block transform found.', 'gutenberg' ),
				array(
					'status' => 404,
				)
			);
		}

		$attributes = $request->get_param( 'attributes' );

		// Create an array representation simulating the output of parse_blocks.
		$block              = array(
			'blockName'    => $request['name'],
			'attrs'        => $attributes,
			'innerHTML'    => '',
			'innerContent' => array(),
		);
		$transform_block_to = '';
		if ( isset( $request['to'] ) ) {
			$transform_block_to = $request['to'];
		}
		// Render using transform_block to ensure all relevant filters are used.
		$data = array(
			'serialized' => transform_block( $block, $transform_block_to ),
		);

		return rest_ensure_response( $data );
	}

}
