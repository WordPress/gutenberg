<?php
/**
 * REST API: Gutenberg_REST_View_Config_Controller_7_1 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides a REST endpoint for retrieving the default
 * view configuration for a given entity type.
 *
 * @since 7.1.0
 */
class Gutenberg_REST_View_Config_Controller_7_1 extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'view-config';
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
					'args'                => array(
						'kind' => array(
							'description' => __( 'Entity kind.', 'gutenberg' ),
							'type'        => 'string',
							'required'    => true,
						),
						'name' => array(
							'description' => __( 'Entity name.', 'gutenberg' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read view config.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to read view config.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Returns the default view configuration for the given entity type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$kind = $request->get_param( 'kind' );
		$name = $request->get_param( 'name' );

		// TODO: this data will come from a registry of view configs per entity.
		$default_view = array(
			'type'       => 'table',
			'filters'    => array(),
			'perPage'    => 20,
			'sort'       => array(
				'field'     => 'title',
				'direction' => 'asc',
			),
			'titleField' => 'title',
			'fields'     => array( 'author', 'status' ),
		);
		$default_layouts = array(
			'table' => array(),
			'grid'  => array(),
			'list'  => array(),
		);
		if ( 'postType' === $kind && 'page' === $name ) {
			$default_view = array(
				'type'       => 'list',
				'filters'    => array(),
				'perPage'    => 20,
				'sort'       => array(
					'field'     => 'title',
					'direction' => 'asc',
				),
				'showLevels' => true,
				'titleField' => 'title',
				'mediaField' => 'featured_media',
				'fields'     => array( 'author', 'status' ),
			);
			$default_layouts = array(
				'table' => array(
					'layout' => array(
						'styles' => array(
							'author' => array(
								'align' => 'start',
							),
						),
					),
				),
				'grid'  => array(),
				'list'  => array(),
			);
		}

		$response = array(
			'kind'            => $kind,
			'name'            => $name,
			'default_view'    => $default_view,
			'default_layouts' => $default_layouts,
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves the item's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'view-config',
			'type'       => 'object',
			'properties' => array(
				'kind'         => array(
					'description' => __( 'Entity kind.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'name'         => array(
					'description' => __( 'Entity name.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'default_view' => array(
					'description' => __( 'Default view configuration.', 'gutenberg' ),
					'type'        => 'object',
					'readonly'    => true,
					'properties'  => array(
						'type'       => array(
							'type' => 'string',
						),
						'search'     => array(
							'type' => 'string',
						),
						'filters'    => array(
							'type'  => 'array',
							'items' => array(
								'type' => 'object',
							),
						),
						'sort'       => array(
							'type'       => 'object',
							'properties' => array(
								'field'     => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array( 'asc', 'desc' ),
								),
							),
						),
						'page'       => array(
							'type' => 'integer',
						),
						'perPage'    => array(
							'type' => 'integer',
						),
						'fields'     => array(
							'type'  => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'type' => 'string',
						),
						'mediaField' => array(
							'type' => 'string',
						),
						'descriptionField' => array(
							'type' => 'string',
						),
						'showTitle'  => array(
							'type' => 'boolean',
						),
						'showMedia'  => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy'    => array(
							'type'       => 'object',
							'properties' => array(
								'field'     => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array( 'asc', 'desc' ),
								),
								'showLabel' => array(
									'type'    => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
					),
				),
				'default_layouts' => array(
					'description'          => __( 'Default layout configurations.', 'gutenberg' ),
					'type'                 => 'object',
					'readonly'             => true,
					'additionalProperties' => array(
						'type' => 'object',
					),
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
