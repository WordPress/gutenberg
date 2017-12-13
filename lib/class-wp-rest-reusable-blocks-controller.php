<?php
/**
 * Reusable Blocks REST API: WP_REST_Reusable_Blocks_Controller class
 *
 * @package gutenberg
 * @since 0.10.0
 */

/**
 * Controller which provides a REST endpoint for Gutenberg to read, create and edit reusable blocks. Reusable blocks are
 * stored as posts with a custom post type.
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
		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword
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
		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword
		$namespace = $this->namespace;

		register_rest_route( $namespace, '/' . $this->rest_base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save_item' ),
				'permission_callback' => array( $this, 'save_item_permissions_check' ),
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );

		register_rest_route( $namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'save_item' ),
				'permission_callback' => array( $this, 'save_item_permissions_check' ),
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );
	}

	/**
	 * Checks if a given request has access to read reusable blocks.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'gutenberg_reusable_block_cannot_read', __( 'Sorry, you are not allowed to read reusable blocks as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		return true;
	}

	/**
	 * Retrieves a collection of reusable blocks.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$reusable_blocks = get_posts( array(
			'post_type' => 'wp_block',
		) );

		$collection = array();

		foreach ( $reusable_blocks as $reusable_block ) {
			$response     = $this->prepare_item_for_response( $reusable_block, $request );
			$collection[] = $this->prepare_response_for_collection( $response );
		}

		return rest_ensure_response( $collection );
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
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'gutenberg_reusable_block_cannot_read', __( 'Sorry, you are not allowed to read reusable blocks as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

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
		$id             = $request['id'];
		$reusable_block = get_post( $id );
		if ( ! $reusable_block ) {
			return new WP_Error( 'gutenberg_reusable_block_not_found', __( 'No reusable block with that ID found.', 'gutenberg' ), array(
				'status' => 404,
			) );
		}

		return $this->prepare_item_for_response( $reusable_block, $request );
	}

	/**
	 * Checks if a given request has access to update/create a reusable block.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function save_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'gutenberg_reusable_block_cannot_edit', __( 'Sorry, you are not allowed to edit reusable blocks as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		return true;
	}

	/**
	 * Updates a single reusable block or creates a new one if no id provided.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function save_item( $request ) {
		$reusable_block = $this->prepare_item_for_database( $request );
		if ( is_wp_error( $reusable_block ) ) {
			return $reusable_block;
		}

		// wp_insert_post will unslash its input, so we have to slash it first.
		$post_id = wp_insert_post( wp_slash( (array) $reusable_block ), true );
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$reusable_block = get_post( $post_id );

		return $this->prepare_item_for_response( $reusable_block, $request );
	}

	/**
	 * Prepares a single reusable block for update.
	 *
	 * @since 0.10.0
	 * @access protected
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Object suitable for passing to wp_insert_post, or WP_Error.
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared_reusable_block = new stdClass();

		$existing_reusable_block = get_post( $request['id'] );
		if ( $existing_reusable_block ) {
			$prepared_reusable_block->ID = $existing_reusable_block->ID;
		}

		$prepared_reusable_block->post_type   = 'wp_block';
		$prepared_reusable_block->post_status = 'publish';

		// Name.
		if ( isset( $request['name'] ) && is_string( $request['name'] ) ) {
			$prepared_reusable_block->post_title = $request['name'];
		} else {
			return new WP_Error( 'gutenberg_reusable_block_invalid_field', __( 'Invalid reusable block name.', 'gutenberg' ), array(
				'status' => 400,
			) );
		}

		// Content.
		if ( isset( $request['content'] ) && is_string( $request['content'] ) ) {
			$prepared_reusable_block->post_content = $request['content'];
		} else {
			return new WP_Error( 'gutenberg_reusable_block_invalid_field', __( 'Invalid reusable block content.', 'gutenberg' ), array(
				'status' => 400,
			) );
		}

		return $prepared_reusable_block;
	}

	/**
	 * Prepares a single reusable block output for response.
	 *
	 * @since 0.10.0
	 * @access protected
	 *
	 * @param WP_Post         $reusable_block The reusable block.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $reusable_block, $request ) {
		$data = array(
			'id'      => $reusable_block->ID,
			'name'    => $reusable_block->post_title,
			'content' => $reusable_block->post_content,
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a response for insertion into a collection.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Response $response Response object.
	 * @return array|mixed Response data, ready for insertion into collection data.
	 */
	public function prepare_response_for_collection( $response ) {
		return (array) $response->get_data();
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
			'$schema'    => 'http://json-schema.org/schema#',
			'title'      => 'reusable-block',
			'type'       => 'object',
			'properties' => array(
				'id'      => array(
					'description' => __( 'ID that identifies this reusable block.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'name'    => array(
					'description' => __( 'Name that identifies this reusable block', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
				),
				'content' => array(
					'description' => __( 'The block\'s HTML content.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
				),
			),
		);
	}
}
