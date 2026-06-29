<?php
/**
 * Guideline Scopes REST API Controller.
 *
 * Read-only controller exposing the `wp_guideline_scopes()` registry at
 * `/wp/v2/knowledge/guideline-scopes`. This is a registry endpoint beside the
 * data routes (the same species as `/wp/v2/statuses`): it has no write paths
 * and carries no data semantics. The Settings → Guidelines page preloads it and
 * reads/writes the scope rows through the standard `/wp/v2/knowledge` collection.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST controller for the guideline scopes registry.
 */
class Gutenberg_Guideline_Scopes_REST_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'knowledge/guideline-scopes';
	}

	/**
	 * Registers the routes for the controller.
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
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether the current user can read guideline scopes.
	 *
	 * Gated on the knowledge read capability, matching the data routes.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'read_knowledge_items' ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to view guideline scopes.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves all registered guideline scopes.
	 *
	 * Labels are resolved at request time (in the request locale).
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$data = array();

		foreach ( wp_guideline_scopes() as $slug => $scope ) {
			$item   = $this->prepare_item_for_response( array_merge( array( 'slug' => $slug ), $scope ), $request );
			$data[] = $this->prepare_response_for_collection( $item );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a single scope for response.
	 *
	 * @param array           $item    Scope data with a `slug` key.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( rest_is_field_included( 'slug', $fields ) ) {
			$data['slug'] = $item['slug'];
		}
		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = isset( $item['title'] ) ? $item['title'] : '';
		}
		if ( rest_is_field_included( 'description', $fields ) ) {
			$data['description'] = isset( $item['description'] ) ? $item['description'] : '';
		}
		if ( rest_is_field_included( 'order', $fields ) ) {
			$data['order'] = isset( $item['order'] ) ? (int) $item['order'] : 0;
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the scope schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'guideline-scope',
			'type'       => 'object',
			'properties' => array(
				'slug'        => array(
					'description' => __( 'An alphanumeric identifier for the scope.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'title'       => array(
					'description' => __( 'The title for the scope.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'description' => array(
					'description' => __( 'A human-readable description of the scope.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'order'       => array(
					'description' => __( 'The sort order of the scope on the Settings page.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
