<?php
/**
 * REST API: WP_REST_Block_Types_Controller class
 *
 * @since      5.5.0
 * @subpackage REST_API
 * @package    WordPress
 */

/**
 * Core class used to access block types via the REST API.
 *
 * This class can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/47620
 *
 * @see   WP_REST_Controller
 */
class WP_REST_Block_Types_Controller extends WP_REST_Controller {

	/**
	 * Instance of WP_Block_Type_Registry.
	 *
	 * @var WP_Block_Type_Registry
	 */
	protected $block_registry;

	/**
	 * Instance of WP_Block_Styles_Registry.
	 *
	 * @var WP_Block_Styles_Registry
	 */
	protected $style_registry;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace      = '__experimental';
		$this->rest_base      = 'block-types';
		$this->block_registry = WP_Block_Type_Registry::get_instance();
		$this->style_registry = WP_Block_Styles_Registry::get_instance();
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
						'description' => __( 'Block name.', 'gutenberg' ),
						'type'        => 'string',
					),
					'namespace' => array(
						'description' => __( 'Block namespace.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read post block types.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->check_read_permission();
	}

	/**
	 * Retrieves all post block types, depending on user context.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$data        = array();
		$block_types = $this->block_registry->get_all_registered();

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$namespace  = '';
		if ( isset( $registered['namespace'] ) && ! empty( $request['namespace'] ) ) {
			$namespace = $request['namespace'];
		}

		foreach ( $block_types as $obj ) {
			if ( $namespace ) {
				$pieces          = explode( '/', $obj->name );
				$block_namespace = $pieces[0];
				if ( $namespace !== $block_namespace ) {
					continue;
				}
			}
			$block_type = $this->prepare_item_for_response( $obj, $request );
			$data[]     = $this->prepare_response_for_collection( $block_type );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to read a block type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
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
	 * Checks whether a given block type should be visible.
	 *
	 * @return WP_Error|bool True if the block type is visible, otherwise false.
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

		return new WP_Error( 'rest_block_type_cannot_view', __( 'Sorry, you are not allowed to manage block types.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Get the block, if the name is valid.
	 *
	 * @param string $name Block name.
	 * @return WP_Block_Type|WP_Error Block type object if name is valid, WP_Error otherwise.
	 */
	protected function get_block( $name ) {
		$block_type = $this->block_registry->get_registered( $name );
		if ( empty( $block_type ) ) {
			return new WP_Error( 'rest_block_type_invalid', __( 'Invalid block type.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		return $block_type;
	}

	/**
	 * Retrieves a specific block type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$block_name = sprintf( '%s/%s', $request['namespace'], $request['name'] );
		$block_type = $this->get_block( $block_name );
		if ( is_wp_error( $block_type ) ) {
			return $block_type;
		}
		$data = $this->prepare_item_for_response( $block_type, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a block type object for serialization.
	 *
	 * @param WP_Block_Type   $block_type block type data.
	 * @param WP_REST_Request $request    Full details about the request.
	 *
	 * @return WP_REST_Response block type data.
	 */
	public function prepare_item_for_response( $block_type, $request ) {

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( rest_is_field_included( 'attributes', $fields ) ) {
			$data['attributes'] = $block_type->get_attributes();
		}

		if ( rest_is_field_included( 'is_dynamic', $fields ) ) {
			$data['is_dynamic'] = $block_type->is_dynamic();
		}

		$schema       = $this->get_item_schema();
		$extra_fields = array(
			'name'             => 'name',
			'title'            => 'title',
			'description'      => 'description',
			'icon'             => 'icon',
			'category'         => 'category',
			'keywords'         => 'keywords',
			'parent'           => 'parent',
			'provides_context' => 'provides_context',
			'uses_context'     => 'uses_context',
			'supports'         => 'supports',
			'styles'           => 'styles',
			'textdomain'       => 'textdomain',
			'example'          => 'example',
			'editor_script'    => 'editor_script',
			'script'           => 'script',
			'editor_style'     => 'editor_style',
			'style'            => 'style',
		);
		foreach ( $extra_fields as $key => $extra_field ) {
			if ( rest_is_field_included( $key, $fields ) ) {
				if ( isset( $block_type->$extra_field ) ) {
					$field = $block_type->$extra_field;
				} elseif ( array_key_exists( 'default', $schema['properties'][ $key ] ) ) {
					$field = $schema['properties'][ $key ]['default'];
				} else {
					$field = '';
				}
				$data[ $key ] = rest_sanitize_value_from_schema( $field, $schema['properties'][ $key ] );
			}
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$styles         = $this->style_registry->get_registered_styles_for_block( $block_type->name );
			$styles         = array_values( $styles );
			$data['styles'] = wp_parse_args( $styles, $data['styles'] );
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$response = rest_ensure_response( $data );

		$response->add_links( $this->prepare_links( $block_type ) );

		/**
		 * Filters a block type returned from the REST API.
		 *
		 * Allows modification of the block type data right before it is returned.
		 *
		 * @param WP_REST_Response $response   The response object.
		 * @param object           $block_type The original block type object.
		 * @param WP_REST_Request  $request    Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_block_type', $response, $block_type, $request );
	}

	/**
	 * Prepares links for the request.
	 *
	 * @param WP_Block_Type $block_type block type data.
	 * @return array Links for the given block type.
	 */
	protected function prepare_links( $block_type ) {
		$pieces    = explode( '/', $block_type->name );
		$namespace = $pieces[0];
		$links     = array(
			'collection' => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
			'self'       => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $block_type->name ) ),
			),
			'up'         => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $namespace ) ),
			),
		);

		if ( $block_type->is_dynamic() ) {
			$links['https://api.w.org/render-block']['href'] = add_query_arg( 'context', 'edit', rest_url( sprintf( '%s/%s/%s', 'wp/v2', 'block-renderer', $block_type->name ) ) );
		}

		return $links;
	}

	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-type',
			'type'       => 'object',
			'properties' => array(
				'title'            => array(
					'description' => __( 'Title of block type.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'name'             => array(
					'description' => __( 'Unique name identifying the block type.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'description'      => array(
					'description' => __( 'Description of block type.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'icon'             => array(
					'description' => __( 'Icon of block type.', 'gutenberg' ),
					'type'        => array( 'string', 'null' ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'attributes'       => array(
					'description'          => __( 'Block attributes.', 'gutenberg' ),
					'type'                 => array( 'object', 'null' ),
					'properties'           => array(),
					'default'              => null,
					'additionalProperties' => array(
						'type' => 'object',
					),
					'context'              => array( 'embed', 'view', 'edit' ),
					'readonly'             => true,
				),
				'provides_context' => array(
					'description'          => __( 'Context provided by blocks of this type.', 'gutenberg' ),
					'type'                 => 'object',
					'properties'           => array(),
					'additionalProperties' => array(
						'type' => 'string',
					),
					'default'              => array(),
					'context'              => array( 'embed', 'view', 'edit' ),
					'readonly'             => true,
				),
				'uses_context'     => array(
					'description' => __( 'Context values inherited by blocks of this type.', 'gutenberg' ),
					'type'        => 'array',
					'default'     => array(),
					'items'       => array(
						'type' => 'string',
					),
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'supports'         => array(
					'description' => __( 'Block supports.', 'gutenberg' ),
					'type'        => 'object',
					'default'     => array(),
					'properties'  => array(),
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'category'         => array(
					'description' => __( 'Block category.', 'gutenberg' ),
					'type'        => array( 'string', null ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'is_dynamic'       => array(
					'description' => __( 'Is the block dynamically rendered.', 'gutenberg' ),
					'type'        => 'boolean',
					'default'     => false,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'editor_script'    => array(
					'description' => __( 'Editor script handle.', 'gutenberg' ),
					'type'        => array( 'string', null ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'script'           => array(
					'description' => __( 'Public facing script handle.', 'gutenberg' ),
					'type'        => array( 'string', null ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'editor_style'     => array(
					'description' => __( 'Editor style handle.', 'gutenberg' ),
					'type'        => array( 'string', null ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'style'            => array(
					'description' => __( 'Public facing style handle.', 'gutenberg' ),
					'type'        => array( 'string', null ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'styles'           => array(
					'description'          => __( 'Block style variations.', 'gutenberg' ),
					'type'                 => 'array',
					'properties'           => array(),
					'additionalProperties' => array(
						'type' => 'object',
					),
					'default'              => array(),
					'context'              => array( 'embed', 'view', 'edit' ),
					'readonly'             => true,
				),
				'textdomain'       => array(
					'description' => __( 'Public text domain.', 'gutenberg' ),
					'type'        => array( 'string', 'null' ),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'parent'           => array(
					'description' => __( 'Parent blocks.', 'gutenberg' ),
					'type'        => array( 'array', 'null' ),
					'items'       => array(
						'type' => 'string',
					),
					'default'     => null,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'keywords'         => array(
					'description' => __( 'Block keywords.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
					'default'     => array(),
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'example'          => array(
					'description'          => __( 'Block example.', 'gutenberg' ),
					'type'                 => array( 'object', 'null' ),
					'default'              => null,
					'properties'           => array(),
					'additionalProperties' => array(
						'type' => 'object',
					),
					'context'              => array( 'embed', 'view', 'edit' ),
					'readonly'             => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for collections.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$new_params              = array();
		$new_params['context']   = $this->get_context_param( array( 'default' => 'view' ) );
		$new_params['namespace'] = array(
			'description' => __( 'Block namespace.', 'gutenberg' ),
			'type'        => 'string',
		);
		return $new_params;
	}

}
