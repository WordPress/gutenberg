<?php
/**
 * REST API: Gutenberg_REST_Hooked_Blocks_Controller class.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 */

/**
 * Core class used to access hooked blocks via the REST API.
 *
 * @since 6.5.0
 *
 */
class Gutenberg_REST_Hooked_Blocks_Controller_6_5 extends WP_REST_Controller {

	/*
	 * Valid entities for the context parameter.
	 *
	 * @since 6.5.0
	 * @var string[]
	 */
	protected $valid_entity_types = array( 'wp_template', 'wp_template_part', 'wp_navigation' );

	/*
	 * Possible positions for hooked blocks.
	 *
	 * @since 6.5.0
	 * @var string[]
	 */
	protected $position_types = array( 'first_child', 'last_child', 'before', 'after' );

	/**
	 * Constructs the controller.
	 *
	 * @since 6.5.0
	 */
	public function __construct() {
		$this->namespace      = 'wp/v2';
		$this->rest_base      = 'hooked-blocks';
		$this->block_registry = WP_Block_Type_Registry::get_instance();
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
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<namespace>[a-zA-Z0-9_-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<namespace>[a-zA-Z0-9_-]+)/(?P<name>[a-zA-Z0-9_-]+)',
			array(
				'args'   => array(
					'name'      => array(
						'description' => __( 'Block name.' ),
						'type'        => 'string',
					),
					'namespace' => array(
						'description' => __( 'Block namespace.' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read hooked block type.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		return $this->check_read_permission();
	}

	/**
	 * Retrieves all hooked block types, depending on user and anchor block context.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$data = array();

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$entity     = '';
		$id         = null;
		$namespace  = '';
		if ( isset( $registered['entity'] ) && ! empty( $request['entity'] ) ) {
			$entity = $request['entity'];
		}
		if ( isset( $registered['id'] ) && ! empty( $request['id'] ) ) {
			$id = $request['id'];
		}
		if ( isset( $registered['namespace'] ) && ! empty( $request['namespace'] ) ) {
			$namespace = $request['namespace'];
		}

		$context = $this->get_context( $entity, $id );
		if ( is_wp_error( $context ) ) {
			return $context;
		}

		// We need to get all registered block types and loop over each of them for the filter.
		// TODO: Look into whether we can optimize get_hooked_blocks() to return filtered results as well.
		$block_types                        = WP_Block_Type_Registry::get_instance()->get_all_registered();
		$hooked_block_types                 = get_hooked_blocks();
		$hooked_block_types_by_anchor_block = array();
		foreach ( array_column( $block_types, 'name' ) as $anchor_block_type ) {
			foreach ( $this->position_types as $position ) {
				$hooked_block_types_by_anchor_block_position = isset( $hooked_block_types[ $anchor_block_type ][ $position ] )
					? $hooked_block_types[ $anchor_block_type ][ $position ]
					: array();

				$hooked_block_types_by_anchor_block[ $anchor_block_type ][ $position ] = apply_filters( 'hooked_block_types', $hooked_block_types_by_anchor_block_position, $position, $anchor_block_type, $context );
			}
		}

		foreach ( $hooked_block_types_by_anchor_block as $anchor_block_type => $hooked_block_types_for_anchor_block ) {
			if ( $namespace ) {
				list ( $block_namespace ) = explode( '/', $anchor_block_type );

				if ( $namespace !== $block_namespace ) {
					continue;
				}
			}
			$data[ $anchor_block_type ] = $this->prepare_response_for_collection( $hooked_block_types_for_anchor_block );
		}

		$data = $this->filter_empty_anchor_blocks( $data );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to read a hooked block type.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		return true;

		$check = $this->check_read_permission();
		if ( is_wp_error( $check ) ) {
			return $check;
		}
		$block_name = sprintf( '%s/%s', $request['namespace'], $request['name'] );
		$block_type = $this->get_block( $block_name );
		if ( is_wp_error( $block_type ) ) {
			return $block_type;
		}

		return true;
	}

	/**
	 * Checks whether a given hooked block type should be visible.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the block type is visible, WP_Error otherwise.
	 */
	protected function check_read_permission() {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}
		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error( 'rest_block_type_cannot_view', __( 'Sorry, you are not allowed to manage block types.' ), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Retrieves hooked blocks for a specific anchor block type.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$block_name = sprintf( '%s/%s', $request['namespace'], $request['name'] );
		$block_type = $this->get_block( $block_name );
		if ( is_wp_error( $block_type ) ) {
			return $block_type;
		}

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$entity     = '';
		$id         = null;
		if ( isset( $registered['entity'] ) && ! empty( $request['entity'] ) ) {
			$entity = $request['entity'];
		}
		if ( isset( $registered['id'] ) && ! empty( $request['id'] ) ) {
			$id = $request['id'];
		}

		$all_hooked_block_types              = get_hooked_blocks();
		$hooked_block_types_for_anchor_block = isset( $all_hooked_block_types[ $block_name ] )
			? $all_hooked_block_types[ $block_name ]
			: array();

		$context = $this->get_context( $entity, $id );
		if ( is_wp_error( $context ) ) {
			return $context;
		}

		foreach ( $this->position_types as $position ) {
			// Making sure that we always pass an array to the filter.
			$positioned_hooked_block_types = isset( $hooked_block_types_for_anchor_block[ $position ] )
				? $hooked_block_types_for_anchor_block[ $position ]
				: array();

			$hooked_block_types_for_anchor_block[ $position ] = apply_filters( 'hooked_block_types', $positioned_hooked_block_types, $position, $block_name, $context );
		}

		$filtered_hooked_block_types_for_anchor_block = $this->filter_empty_anchor_blocks( array( $block_name => $hooked_block_types_for_anchor_block ) );
		$filtered_hooked_block_types_for_anchor_block = isset( $filtered_hooked_block_types_for_anchor_block[ $block_name ] )
			? $filtered_hooked_block_types_for_anchor_block[ $block_name ]
			: array();

		$data = $this->prepare_item_for_response( $filtered_hooked_block_types_for_anchor_block, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a hooked blocks array for serialization.
	 *
	 * @since 6.50
	 *
	 * @param array           $item    Block type data.
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Block type data.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// TODO: Add filter for response.
		$response = rest_ensure_response( $item );
		return $response;
	}

	/**
	 * Retrieves the query params for the hooked blocks collection.
	 *
	 * @since 6.5.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return array(
			'context'   => $this->get_context_param( array( 'default' => 'view' ) ),
			'entity'    => array(
				'description' => __( 'Entity type to get hooked blocks for.' ),
				'type'        => 'string',
			),
			'id'        => array(
				'description' => __( 'Entity ID to get hooked blocks for.' ),
				'type'        => array( 'string', 'integer' ),
			),
			'namespace' => array(
				'description' => __( 'Block namespace.' ),
				'type'        => 'string',
			),
		);
	}

	/**
	 * Retrieves the hooked blocks schema, conforming to JSON Schema.
	 *
	 * @since 6.5.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'hooked_blocks',
			'type'       => 'array',
			'properties' => array(
				'block_name' => array(
					'description' => __( 'Block namespace.' ),
					'type'        => array( 'array' ),
					'readonly'    => true,
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'position_key' => array(
							'description' => __( 'Positive key' ),
							'type'        => 'array',
							'readonly'    => true,
							'context'     => array( 'view', 'edit' ),
							'items'       => array(
								'type' => 'string',
							),
						),
					),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

		/**
	 * Get the block, if the name is valid.
	 *
	 * @since 6.5.0
	 *
	 * @param string $name Block name.
	 * @return WP_Block_Type|WP_Error Block type object if name is valid, WP_Error otherwise.
	 */
	protected function get_block( $name ) {
		$block_type = $this->block_registry->get_registered( $name );
		if ( empty( $block_type ) ) {
			return new WP_Error( 'rest_block_type_invalid', __( 'Invalid block type.' ), array( 'status' => 404 ) );
		}

		return $block_type;
	}

	/**
	 * Get the correct context for the request.
	 *
	 * @since 6.5.0
	 *
	 * @param string $entity Context entity.
	 * @param string $id     Context ID.
	 * @return WP_Block_Template|WP_Post|null Context object if name is valid, WP_Error otherwise.
	 */
	protected function get_context( $entity, $id ) {
		if ( ! $entity && ! $id ) {
			return null; // No context specified.
		}

		if ( ! in_array( $entity, $this->valid_entity_types, true ) ) {
			return new WP_Error( 'rest_hooked_blocks_invalid_entity_context', __( 'Invalid entity.' ), array( 'status' => 404 ) );
		}

		// Suppress all hooked blocks getting inserted into the context.
		add_filter( 'hooked_block_types', '__return_empty_array', 99999, 0 );

		if ( ( 'wp_template' === $entity || 'wp_template_part' === $entity ) && ! empty( $id ) ) {
			$context = get_block_template( $id, $entity );
		}

		if ( 'wp_navigation' === $entity && ! empty( $id ) ) {
			$context = get_post( (int) $id );
		}

		// Remove the filter to allow hooked blocks to be inserted for all purposes.
		remove_filter( 'hooked_block_types', '__return_empty_array', 99999 );

		return $context;
	}

	/**
	 * Filters out empty anchor blocks from the response array.
	 *
	 * @since 6.5.0
	 *
	 * @param array $hooked_blocks Array of block types and their hooked blocks.
	 * @return array Filtered array of block types and their hooked blocks.
	 */
	protected function filter_empty_anchor_blocks( $hooked_blocks ) {
		$filtered_array = array();

		foreach ( $hooked_blocks as $key => $value ) {
			// If the current value is an array and it's not empty, add it to the filtered array
			if ( is_array( $value ) && ! empty( $value ) ) {
				// Recursively filter the children arrays
				$filtered_children = $this->filter_empty_anchor_blocks( $value );
				// If any non-empty children were found, add them to the filtered array
				if ( ! empty( $filtered_children ) ) {
					$filtered_array[ $key ] = $filtered_children;
				}
			} elseif ( ! empty( $value ) ) {
				// If the value is not an array but not empty, add it directly to the filtered array
				$filtered_array[ $key ] = $value;
			}
		}

		return $filtered_array;
	}
}
