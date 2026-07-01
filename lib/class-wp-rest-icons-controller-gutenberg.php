<?php
/**
 * REST API: Bundle WP_Icons_Registry_Gutenberg class instead of inheriting per WordPress version class
 *
 * Changes to this class should be synced to the corresponding class
 * in WordPress core: src/wp-includes/rest-api/endpoints/class-wp-rest-icons-controller.php.
 *
 * @package    gutenberg
 * @subpackage REST_API
 */

/**
 * Gutenberg Icons REST API Controller.
 *
 * @since 7.1.0
 */
class WP_REST_Icons_Controller_Gutenberg extends WP_REST_Icons_Controller {

	/**
	 * Registers the routes for icons.
	 *
	 * Adds a collection-scoped route (`/icons/<namespace>`) in addition to
	 * the base class's list and single-item routes.
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<namespace>[a-z][a-z-]*)',
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
	 * Retrieves the query params for the icons collection.
	 *
	 * Extends the base params with a `namespace` parameter that corresponds
	 * to an icon collection slug. The same parameter is also captured as a
	 * URL segment by the collection-scoped route.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params              = parent::get_collection_params();
		$query_params['namespace'] = array(
			'description' => __( 'Limit results to icons belonging to the given collection slug.', 'gutenberg' ),
			'type'        => 'string',
			'pattern'     => '^[a-z][a-z-]*$',
		);
		return $query_params;
	}

	/**
	 * Retrieves all icons, optionally scoped to a collection via URL segment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$collection = $request->get_param( 'namespace' );

		if ( null !== $collection && ! WP_Icon_Collections_Registry::get_instance()->is_registered( $collection ) ) {
			return new WP_Error(
				'rest_icon_collection_not_found',
				sprintf(
					/* translators: %s: Icon collection slug. */
					__( 'Icon collection not found: "%s".', 'gutenberg' ),
					$collection
				),
				array( 'status' => 404 )
			);
		}

		$response = array();
		$search   = $request->get_param( 'search' );
		$icons    = WP_Icons_Registry::get_instance()->get_registered_icons( $search );

		foreach ( $icons as $icon ) {
			if ( null !== $collection && ( ! isset( $icon['collection'] ) || $icon['collection'] !== $collection ) ) {
				continue;
			}
			$prepared_icon = $this->prepare_item_for_response( $icon, $request );
			$response[]    = $this->prepare_response_for_collection( $prepared_icon );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Prepare a raw icon before it gets output in a REST API response.
	 *
	 * Adds a `collection` field to the base response while keeping the
	 * namespaced icon name (e.g. `core/arrow-left`) as the `name` field.
	 *
	 * @param array           $item    Raw icon as registered.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$fields   = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'collection', $fields ) && isset( $item['collection'] ) ) {
			$data               = $response->get_data();
			$data['collection'] = $item['collection'];
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Retrieves the icon schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = parent::get_item_schema();

		$schema['properties']['collection'] = array(
			'description' => __( 'The slug of the collection this icon belongs to.', 'gutenberg' ),
			'type'        => 'string',
			'readonly'    => true,
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
