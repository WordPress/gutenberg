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
	public function get_items_permissions_check(
		// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$request
	) {
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
		$default_view    = array(
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
		$all_items_title = __( 'All items', 'gutenberg' );
		if ( 'postType' === $kind ) {
			$post_type_object = get_post_type_object( $name );
			if ( $post_type_object && ! empty( $post_type_object->labels->all_items ) ) {
				$all_items_title = $post_type_object->labels->all_items;
			}
		}
		$view_list = array(
			array(
				'title' => $all_items_title,
				'slug'  => 'all',
			),
		);
		if ( 'postType' === $kind && 'page' === $name ) {
			$default_view    = array(
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
			$view_list       = array(
				array(
					'title' => $all_items_title,
					'slug'  => 'all',
				),
				array(
					'title' => __( 'Published', 'gutenberg' ),
					'slug'  => 'published',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'publish',
								'isLocked' => true,
							),
						),
					),
				),
				array(
					'title' => __( 'Scheduled', 'gutenberg' ),
					'slug'  => 'future',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'future',
								'isLocked' => true,
							),
						),
					),
				),
				array(
					'title' => __( 'Drafts', 'gutenberg' ),
					'slug'  => 'drafts',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'draft',
								'isLocked' => true,
							),
						),
					),
				),
				array(
					'title' => __( 'Pending', 'gutenberg' ),
					'slug'  => 'pending',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'pending',
								'isLocked' => true,
							),
						),
					),
				),
				array(
					'title' => __( 'Private', 'gutenberg' ),
					'slug'  => 'private',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'private',
								'isLocked' => true,
							),
						),
					),
				),
				array(
					'title' => __( 'Trash', 'gutenberg' ),
					'slug'  => 'trash',
					'view'  => array(
						'type'    => 'table',
						'layout'  => isset( $default_layouts['table']['layout'] ) ? $default_layouts['table']['layout'] : array(),
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'trash',
								'isLocked' => true,
							),
						),
					),
				),
			);
		}

		$response = array(
			'kind'            => $kind,
			'name'            => $name,
			'default_view'    => $default_view,
			'default_layouts' => $default_layouts,
			'view_list'       => $view_list,
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

		$view_base_properties = $this->get_view_base_schema();

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'view-config',
			'type'       => 'object',
			'properties' => array(
				'kind'            => array(
					'description' => __( 'Entity kind.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'name'            => array(
					'description' => __( 'Entity name.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'default_view'    => array(
					'description' => __( 'Default view configuration.', 'gutenberg' ),
					'type'        => 'object',
					'readonly'    => true,
					'properties'  => array_merge(
						array(
							'type' => array(
								'type' => 'string',
							),
						),
						$view_base_properties
					),
				),
				'default_layouts' => array(
					'description' => __( 'Default layout configurations.', 'gutenberg' ),
					'type'        => 'object',
					'readonly'    => true,
					'properties'  => array(
						'table'       => array(
							'type'       => 'object',
							'properties' => array_merge(
								$view_base_properties,
								array(
									'layout' => $this->get_table_layout_schema(),
								)
							),
						),
						'list'        => array(
							'type'       => 'object',
							'properties' => array_merge(
								$view_base_properties,
								array(
									'layout' => $this->get_list_layout_schema(),
								)
							),
						),
						'grid'        => array(
							'type'       => 'object',
							'properties' => array_merge(
								$view_base_properties,
								array(
									'layout' => $this->get_grid_layout_schema(),
								)
							),
						),
						'activity'    => array(
							'type'       => 'object',
							'properties' => array_merge(
								$view_base_properties,
								array(
									'layout' => $this->get_list_layout_schema(),
								)
							),
						),
						'pickerGrid'  => array(
							'type'       => 'object',
							'properties' => array_merge(
								$view_base_properties,
								array(
									'layout' => $this->get_grid_layout_schema(),
								)
							),
						),
						'pickerTable' => array(
							'type'       => 'object',
							'properties' => array_merge(
								$view_base_properties,
								array(
									'layout' => $this->get_table_layout_schema(),
								)
							),
						),
					),
				),
				'view_list'       => array(
					'description' => __( 'List of default views.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'title' => array(
								'type' => 'string',
							),
							'slug'  => array(
								'type' => 'string',
							),
							'view'  => array(
								'type'       => 'object',
								'properties' => array_merge(
									array(
										'type'   => array(
											'type' => 'string',
										),
										'layout' => $this->get_combined_layout_schema(),
									),
									$view_base_properties
								),
							),
						),
					),
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Returns the schema properties shared by all view types (ViewBase), excluding 'type'.
	 *
	 * @return array Schema properties for the base view configuration.
	 */
	private function get_view_base_schema() {
		return array(
			'search'                => array(
				'type' => 'string',
			),
			'filters'               => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'field'    => array(
							'type' => 'string',
						),
						'operator' => array(
							'type' => 'string',
							'enum' => array(
								'is',
								'isNot',
								'isAny',
								'isNone',
								'isAll',
								'isNotAll',
								'lessThan',
								'greaterThan',
								'lessThanOrEqual',
								'greaterThanOrEqual',
								'before',
								'after',
							),
						),
						'value'    => array(),
						'isLocked' => array(
							'type' => 'boolean',
						),
					),
				),
			),
			'sort'                  => array(
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
			'page'                  => array(
				'type' => 'integer',
			),
			'perPage'               => array(
				'type' => 'integer',
			),
			'fields'                => array(
				'type'  => 'array',
				'items' => array(
					'type' => 'string',
				),
			),
			'titleField'            => array(
				'type' => 'string',
			),
			'mediaField'            => array(
				'type' => 'string',
			),
			'descriptionField'      => array(
				'type' => 'string',
			),
			'showTitle'             => array(
				'type' => 'boolean',
			),
			'showMedia'             => array(
				'type' => 'boolean',
			),
			'showDescription'       => array(
				'type' => 'boolean',
			),
			'showLevels'            => array(
				'type' => 'boolean',
			),
			'groupBy'               => array(
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
		);
	}

	/**
	 * Returns the schema for the ColumnStyle type.
	 *
	 * @return array Schema for a column style object.
	 */
	private function get_column_style_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'width'    => array(
					'type' => array( 'string', 'number' ),
				),
				'maxWidth' => array(
					'type' => array( 'string', 'number' ),
				),
				'minWidth' => array(
					'type' => array( 'string', 'number' ),
				),
				'align'    => array(
					'type' => 'string',
					'enum' => array( 'start', 'center', 'end' ),
				),
			),
		);
	}

	/**
	 * Returns the layout schema for table-type views (ViewTable, ViewPickerTable).
	 *
	 * @return array Schema for a table layout object.
	 */
	private function get_table_layout_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'styles'       => array(
					'type'                 => 'object',
					'additionalProperties' => $this->get_column_style_schema(),
				),
				'density'      => array(
					'type' => 'string',
					'enum' => array( 'compact', 'balanced', 'comfortable' ),
				),
				'enableMoving' => array(
					'type' => 'boolean',
				),
			),
		);
	}

	/**
	 * Returns the layout schema for list-type views (ViewList, ViewActivity).
	 *
	 * @return array Schema for a list layout object.
	 */
	private function get_list_layout_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'density' => array(
					'type' => 'string',
					'enum' => array( 'compact', 'balanced', 'comfortable' ),
				),
			),
		);
	}

	/**
	 * Returns a combined layout schema that accepts properties from all view types.
	 *
	 * This is useful for contexts where the view type is not known ahead of time
	 * (e.g. the `view` override in a view list item), so all possible layout
	 * properties must be accepted.
	 *
	 * @return array Schema for a combined layout object.
	 */
	private function get_combined_layout_schema() {
		return array(
			'type'       => 'object',
			'properties' => array_merge(
				$this->get_table_layout_schema()['properties'],
				$this->get_grid_layout_schema()['properties']
			),
		);
	}

	/**
	 * Returns the layout schema for grid-type views (ViewGrid, ViewPickerGrid).
	 *
	 * @return array Schema for a grid layout object.
	 */
	private function get_grid_layout_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'badgeFields' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
				'previewSize' => array(
					'type' => 'number',
				),
				'density'     => array(
					'type' => 'string',
					'enum' => array( 'compact', 'balanced', 'comfortable' ),
				),
			),
		);
	}
}
