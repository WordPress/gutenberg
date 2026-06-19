<?php
/**
 * REST API: Gutenberg_REST_Field_Collections_Controller class
 *
 * @package gutenberg
 * @since 20.8.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Core controller used to access field collections via the REST API.
 *
 * @since 20.8.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Field_Collections_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 20.8.0
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'field-collections';
	}

	/**
	 * Registers the routes for field collections.
	 *
	 * @since 20.8.0
	 *
	 * @see register_rest_route()
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
	}

	/**
	 * Checks if a given request has access to read field collections.
	 *
	 * @since 20.8.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to view field collections.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves field collections.
	 *
	 * @since 20.8.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$kind = $request->get_param( 'kind' );
		$name = $request->get_param( 'name' );

		// Get collections for the specified entity.
		$collections = gutenberg_get_field_collections( $kind, $name );

		$data = array();
		foreach ( $collections as $collection ) {
			$data[] = $this->prepare_item_for_response( $collection, $request );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a single field collection output for response.
	 *
	 * @since 20.8.0
	 *
	 * @param array           $collection Field collection data.
	 * @param WP_REST_Request $request   Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $collection, $request ) {
		$data = array(
			'id'             => $collection['id'],
			'kind'           => $collection['kind'],
			'name'           => $collection['name'],
			'fields'         => $collection['fields'],
			'fields_modules' => isset( $collection['fields_modules'] ) ? $collection['fields_modules'] : array(),
		);

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		/**
		 * Filters the field collection data for a REST API response.
		 *
		 * @since 20.8.0
		 *
		 * @param array            $data       The prepared field collection data.
		 * @param array            $collection Original field collection data.
		 * @param WP_REST_Request  $request   Request used to generate the response.
		 */
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		return apply_filters( 'rest_prepare_field_collection', $data, $collection, $request );
	}

	/**
	 * Retrieves the field collection schema, conforming to JSON Schema.
	 *
	 * @since 20.8.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'field-collection',
			'type'       => 'object',
			'properties' => array(
				'id'             => array(
					'description' => __( 'Unique identifier for the field collection.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'kind'           => array(
					'description' => __( 'Entity kind (postType, taxonomy, user, etc.).', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'name'           => array(
					'description' => __( 'Entity name or null for universal collections.', 'gutenberg' ),
					'type'        => array( 'string', 'null' ),
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'fields'         => array(
					'description' => __( 'Field definitions keyed by field ID.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'fields_modules' => array(
					'description' => __( 'Script Module handles for non-serializable field extensions, in merge order.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for field collections.
	 *
	 * @since 20.8.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();

		$params['kind'] = array(
			'description' => __( 'Entity kind (postType, taxonomy, root etc.).', 'gutenberg' ),
			'type'        => 'string',
			'required'    => true,
		);

		$params['name'] = array(
			'description' => __( 'Entity name (attachment, product, user, etc.).', 'gutenberg' ),
			'type'        => 'string',
			'required'    => true,
		);

		return $params;
	}
}
