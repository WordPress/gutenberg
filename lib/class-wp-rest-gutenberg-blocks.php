<?php
/**
 * Rest API endpoints for Gutenberg blocks.
 */
class WP_Gutenberg_Block_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 *
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'blocks';
	}

	/**
	 * Register the block routes.
	 *
	 * @since 1.1.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {

		// Add a post collection block route.
		register_rest_route( $this->namespace, '/' . $this->rest_base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => $this->get_collection_params(),
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );

		$schema = $this->get_item_schema();
		$get_item_args = array(
			'context'  => $this->get_context_param( array( 'default' => 'view' ) ),
		);

		// Add a single post block route.
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', array(
			'args' => array(
				'id' => array(
					'description' => __( 'Unique identifier for the post.' ),
					'type'        => 'integer',
				),
			),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
				'args'                => $get_item_args,
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );
	}

	/**
	 * Checks if a given request has access to read posts and their blocks.
	 *
	 * @since 1.1.0
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {

		return true;
	}

	/**
	 * Retrieves a collection of posts blocks.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$args = array();

		/**
		 * Filters the query arguments for a request.
		 *
		 * Enables adding extra arguments or setting defaults for a post blocks collection request.
		 *
		 * @since 1.1.0
		 *
		 * @link https://developer.wordpress.org/reference/classes/wp_query/
		 *
		 * @param array           $args    Key value array of query var to query value.
		 * @param WP_REST_Request $request The request used.
		 */
		$args = apply_filters( "rest_blocks_query", $args, $request );
		$query_args = $this->prepare_items_query( $args, $request );

		$posts_query  = new WP_Query();
		$query_result = $posts_query->query( $query_args );
		$registry = WP_Block_Type_Registry::get_instance();
		foreach ( $query_result as $post ) {
			if ( ! $this->check_read_permission( $post ) ) {
				continue;
			}

			// Parse the blocks from post content.
			$data = $this->get_block_data_from_content( $post->post_content );

			$posts[] = $data;
		}
		$response = rest_ensure_response( $posts );

		return $response;
	}

	/**
	 * Get the blocks for a post, if the ID is valid.
	 *
	 * @since 1.1.0
	 *
	 * @param int $id Supplied ID.
	 *
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_post( $id ) {
		$error = new WP_Error( 'rest_post_invalid_id', __( 'Invalid post ID.' ), array( 'status' => 404 ) );

		if ( (int) $id <= 0 ) {
			return $error;
		}

		$post = get_post( (int) $id );
		if ( empty( $post ) || empty( $post->ID ) ) {
			return $error;
		}

		return $post;
	}

	/**
	 * Checks if a given request has access to read a post and its blocks.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$post = $this->get_post( (int) $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( $post ) {
			return $this->check_read_permission( $post );
		}

		$error = new WP_Error( 'rest_post_invalid', __( 'Invalid post.' ), array( 'status' => 404 ) );
		return $error;
	}

	/**
	 * Retrieves a single post's blocks.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$data = $this->get_block_data_from_content( $post->post_content );

		$response = rest_ensure_response( $data );

		return $response;
	}

	/**
	 * Determines the allowed query_vars for a get_items() response and prepares
	 * them for WP_Query.
	 *
	 * @since 1.1.0
	 *
	 * @param array           $prepared_args Optional. Prepared WP_Query arguments. Default empty array.
	 * @param WP_REST_Request $request       Optional. Full details about the request.
	 *
	 * @return array Items query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args = array();

		foreach ( $prepared_args as $key => $value ) {

			/**
			 * Filters the query_vars used in get_items() for the constructed query.
			 *
			 * The dynamic portion of the hook name, `$key`, refers to the query_var key.
			 *
			 * @since 1.1.0
			 *
			 * @param string $value The query_var value.
			 */
			$query_args[ $key ] = apply_filters( "rest_query_var-{$key}", $value );
		}

		return $query_args;
	}

	/**
	 * Checks if a given post type can be viewed or managed.
	 *
	 * @since 1.1.0
	 *
	 * @param object|string $post_type Post type name or object.
	 *
	 * @return bool Whether the post type is allowed in REST.
	 */
	protected function check_is_post_type_allowed( $post_type ) {
		if ( ! is_object( $post_type ) ) {
			$post_type = get_post_type_object( $post_type );
		}

		if ( ! empty( $post_type ) && ! empty( $post_type->show_in_rest ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if a post's blocks can be read.
	 *
	 * @since 1.1.0
	 *
	 * @param object $post Post object.
	 *
	 * @return bool Whether the post can be read.
	 */
	public function check_read_permission( $post ) {
		$post_type = get_post_type_object( $post->post_type );
		if ( ! $this->check_is_post_type_allowed( $post_type ) ) {
			return false;
		}

		// Is the post readable?
		if ( 'publish' === $post->post_status || current_user_can( $post_type->cap->read_post, $post->ID ) ) {
			return true;
		}

		$post_status_obj = get_post_status_object( $post->post_status );
		if ( $post_status_obj && $post_status_obj->public ) {
			return true;
		}

		return false;
	}

	/**
	 * Retrieves the post's schema, conforming to JSON Schema.
	 *
	 * @since 1.1.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {

		$schema = array(
			'$schema'    => 'http://json-schema.org/schema#',
			'title'      => 'blocks',
			'type'       => 'object',

			// Base properties for every Block.
			'properties' => array(
				'blockName'            => array(
					'description' => __( "The name of the block." ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'attrs'              => array(
					'description' => __( 'The block data attributes.' ),
					'type'        => 'array',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'rawContent'            => array(
					'description' => __( 'The raw block content.' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'arg_options' => array(
						'sanitize_callback' => array( $this, 'sanitize_slug' ),
					),
				),
			),
		);

		$post_type_obj = get_post_type_object( $this->post_type );

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Retrieves the query params for the posts collection.
	 *
	 * @since 1.1.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();


		/**
		 * Filter collection parameters for the posts controller.
		 *
		 * The dynamic part of the filter `$this->post_type` refers to the post
		 * type slug for the controller.
		 *
		 * This filter registers the collection parameter, but does not map the
		 * collection parameter to an internal WP_Query parameter. Use the
		 * `rest_{$this->post_type}_query` filter to set WP_Query parameters.
		 *
		 * @since 1.1.0
		 *
		 * @param array        $query_params JSON Schema-formatted collection parameters.
		 * @param WP_Post_Type $post_type    Post type object.
		 */
		return apply_filters( "rest_blocks_collection_params", $query_params, $post_type );
	}

	/**
	 * Extract the blocks from post content.
	 *
	 * @since 1.1.0
	 *
	 * @param string The post content.
	 *
	 * @return array Array of block data.
	 */
	public function get_block_data_from_content( $content ) {
		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = gutenberg_parse_blocks( $content );
		$data     = array();

		// Loop thru the blocks, adding rendered content when available.
		foreach ( $blocks as $block ) {
			$block_name  = isset( $block['blockName'] ) ? $block['blockName'] : null;
			$attributes  = is_array( $block['attrs'] ) ? $block['attrs'] : array();
			$raw_content = isset( $block['rawContent'] ) ? $block['rawContent'] : null;
			if ( $block_name ) {
				$block_type = $registry->get_registered( $block_name );
				if ( null !== $block_type ) {
					$block['renderedContent'] = $block_type->render( $attributes, $raw_content );
				}
			}
			$data[] = $block;
		}
		return $data;
	}
}
