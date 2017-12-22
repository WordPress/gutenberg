<?php
/**
 * REST API: WP_REST_Autosaves_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 5.0.0
 */

/**
 * Core class used to access autosaves via the REST API.
 *
 * @since 5.0.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Autosaves_Controller extends WP_REST_Revisions_Controller {

	/**
	 * Parent post type.
	 *
	 * @since 5.0.0
	 * @var string
	 */
	private $parent_post_type;

	/**
	 * Parent controller.
	 *
	 * @since 5.0.0
	 * @var WP_REST_Controller
	 */
	private $parent_controller;

	/**
	 * The base of the parent controller's route.
	 *
	 * @since 5.0.0
	 * @var string
	 */
	private $parent_base;

	/**
	 * Constructor.
	 *
	 * @since 5.0.0
	 *
	 * @param string $parent_post_type Post type of the parent.
	 */
	public function __construct( $parent_post_type ) {
		$this->parent_post_type  = $parent_post_type;
		$this->parent_controller = new WP_REST_Posts_Controller( $parent_post_type );
		$this->namespace         = 'wp/v2';
		$this->rest_base         = 'autosaves';
		$post_type_object        = get_post_type_object( $parent_post_type );
		$this->parent_base       = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;
	}

	/**
	 * Registers routes for autosaves based on post types supporting autosaves.
	 *
	 * @since 5.0.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace, '/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base, array(
				'args'   => array(
					'parent' => array(
						'description' => __( 'The ID for the parent of the object.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace, '/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)', array(
				'args'   => array(
					'parent' => array(
						'description' => __( 'The ID for the parent of the object.' ),
						'type'        => 'integer',
					),
					'id'     => array(
						'description' => __( 'Unique identifier for the object.' ),
						'type'        => 'integer',
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
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Required to be true, as autosaves do not support trashing.' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

	}

	/**
	 * Creates a single autosave.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		// Map new fields onto the existing post data.
		$parent = $this->get_parent( $request['parent'] );

		foreach( $prepared_post as $key => $value ) {
			$existing_post->$key = $value;
		}
		$prepared_post = $this->prepare_item_for_database( $request );

		$autosave_id = gutenberg_create_post_autosave( (array) $existing_post );
		$post = get_post( $autosave_id );

		$request->set_param( 'context', 'edit' );

		$response = $this->prepare_item_for_response( $post, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $post_id ) ) );

		return $response;
	}


	/**
	 * Checks if a given request has access to create an autosave.
	 *
	 * @since 5.0.0
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$parent = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		$response = $this->get_items_permissions_check( $request );
		if ( ! $response || is_wp_error( $response ) ) {
			return $response;
		}

		$post_type = get_post_type_object( 'revision' );
		return current_user_can( $post_type->cap->edit_post, $parent->ID );
	}


	/**
	 * Get the parent post, if the ID is valid.
	 *
	 * @since 5.0.0
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_parent( $parent ) {
		$error = new WP_Error( 'rest_post_invalid_parent', __( 'Invalid post parent ID.' ), array( 'status' => 404 ) );
		if ( (int) $parent <= 0 ) {
			return $error;
		}

		$parent = get_post( (int) $parent );
		if ( empty( $parent ) || empty( $parent->ID ) || $this->parent_post_type !== $parent->post_type ) {
			return $error;
		}

		return $parent;
	}

	/**
	 * Get the revision, if the ID is valid.
	 *
	 * @since 5.0.0
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Post|WP_Error Revision post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_revision( $id ) {
		$error = new WP_Error( 'rest_post_invalid_id', __( 'Invalid revision ID.' ), array( 'status' => 404 ) );
		if ( (int) $id <= 0 ) {
			return $error;
		}

		$revision = get_post( (int) $id );
		if ( empty( $revision ) || empty( $revision->ID ) || 'revision' !== $revision->post_type ) {
			return $error;
		}

		return $revision;
	}

	/**
	 * Gets a collection of autosaves using wp_get_post_autosave.
	 *
	 * Contains the user's autosave, for empty if it doesn't exist.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$parent = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		$autosave = wp_get_post_autosave( $request['parent'] );

		if ( ! $autosave ) {
			return array();
		}

		$response = array();
		$data       = $this->prepare_item_for_response( $autosave, $request );
		$response[] = $this->prepare_response_for_collection( $data );

		return rest_ensure_response( $response );
	}


	/**
	 * Retrieves the autosave's schema, conforming to JSON Schema.
	 *
	 * @since 5.0.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => "{$this->parent_post_type}-autosave",
			'type'       => 'object',
			// Base properties for every Revision.
			'properties' => array(
				'author'       => array(
					'description' => __( 'The ID for the author of the object.' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'date'         => array(
					'description' => __( "The date the object was published, in the site's timezone." ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'date_gmt'     => array(
					'description' => __( 'The date the object was published, as GMT.' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'guid'         => array(
					'description' => __( 'GUID for the object, as it exists in the database.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
				),
				'id'           => array(
					'description' => __( 'Unique identifier for the object.' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'modified'     => array(
					'description' => __( "The date the object was last modified, in the site's timezone." ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'modified_gmt' => array(
					'description' => __( 'The date the object was last modified, as GMT.' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'parent'       => array(
					'description' => __( 'The ID for the parent of the object.' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'slug'         => array(
					'description' => __( 'An alphanumeric identifier for the object unique to its type.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			),
		);

		$parent_schema = $this->parent_controller->get_item_schema();

		if ( ! empty( $parent_schema['properties']['title'] ) ) {
			$schema['properties']['title'] = $parent_schema['properties']['title'];
		}

		if ( ! empty( $parent_schema['properties']['content'] ) ) {
			$schema['properties']['content'] = $parent_schema['properties']['content'];
		}

		if ( ! empty( $parent_schema['properties']['excerpt'] ) ) {
			$schema['properties']['excerpt'] = $parent_schema['properties']['excerpt'];
		}

		if ( ! empty( $parent_schema['properties']['guid'] ) ) {
			$schema['properties']['guid'] = $parent_schema['properties']['guid'];
		}

		return $this->add_additional_fields_schema( $schema );
	}


}
