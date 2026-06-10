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

		$config = gutenberg_get_entity_view_config( $kind, $name );

		$response = array(
			'kind'            => $kind,
			'name'            => $name,
			'default_view'    => $config['default_view'],
			'default_layouts' => $config['default_layouts'],
			'view_list'       => $config['view_list'],
			'form'            => $config['form'],
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
				'form'            => array(
					'description' => __( 'Default form configuration.', 'gutenberg' ),
					'type'        => 'object',
					'readonly'    => true,
					'properties'  => $this->get_form_schema(),
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

	/**
	 * Returns the schema for a form layout object as a discriminated union.
	 *
	 * Each variant is discriminated by a single-value enum on its `type` property,
	 * matching the TypeScript Layout union in dataviews/src/types/dataform.ts.
	 *
	 * @return array Schema for a form layout object.
	 */
	private function get_form_layout_schema() {
		return array(
			'oneOf' => array(
				// RegularLayout.
				array(
					'type'       => 'object',
					'properties' => array(
						'type'          => array(
							'type' => 'string',
							'enum' => array( 'regular' ),
						),
						'labelPosition' => array(
							'type' => 'string',
							'enum' => array( 'top', 'side', 'none' ),
						),
					),
				),
				// PanelLayout.
				array(
					'type'       => 'object',
					'properties' => array(
						'type'           => array(
							'type' => 'string',
							'enum' => array( 'panel' ),
						),
						'labelPosition'  => array(
							'type' => 'string',
							'enum' => array( 'top', 'side', 'none' ),
						),
						'openAs'         => array(
							'oneOf' => array(
								array(
									'type' => 'string',
									'enum' => array( 'dropdown', 'modal' ),
								),
								array(
									'type'       => 'object',
									'properties' => array(
										'type'        => array(
											'type' => 'string',
											'enum' => array( 'dropdown', 'modal' ),
										),
										'applyLabel'  => array(
											'type' => 'string',
										),
										'cancelLabel' => array(
											'type' => 'string',
										),
									),
								),
							),
						),
						'summary'        => array(
							'oneOf' => array(
								array( 'type' => 'string' ),
								array(
									'type'  => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
							),
						),
						'editVisibility' => array(
							'type' => 'string',
							'enum' => array( 'always', 'on-hover' ),
						),
					),
				),
				// CardLayout.
				array(
					'type'       => 'object',
					'properties' => array(
						'type'          => array(
							'type' => 'string',
							'enum' => array( 'card' ),
						),
						'withHeader'    => array(
							'type' => 'boolean',
						),
						'isOpened'      => array(
							'type' => 'boolean',
						),
						'isCollapsible' => array(
							'type' => 'boolean',
						),
						'summary'       => array(
							'oneOf' => array(
								array( 'type' => 'string' ),
								array(
									'type'  => 'array',
									'items' => array(
										'oneOf' => array(
											array( 'type' => 'string' ),
											array(
												'type' => 'object',
												'properties' => array(
													'id' => array(
														'type' => 'string',
													),
													'visibility' => array(
														'type' => 'string',
														'enum' => array( 'always', 'when-collapsed' ),
													),
												),
											),
										),
									),
								),
							),
						),
					),
				),
				// RowLayout.
				array(
					'type'       => 'object',
					'properties' => array(
						'type'      => array(
							'type' => 'string',
							'enum' => array( 'row' ),
						),
						'alignment' => array(
							'type' => 'string',
							'enum' => array( 'start', 'center', 'end' ),
						),
						'styles'    => array(
							'type'                 => 'object',
							'additionalProperties' => array(
								'type'       => 'object',
								'properties' => array(
									'flex' => array(
										'type' => array( 'string', 'number' ),
									),
								),
							),
						),
					),
				),
				// DetailsLayout.
				array(
					'type'       => 'object',
					'properties' => array(
						'type'    => array(
							'type' => 'string',
							'enum' => array( 'details' ),
						),
						'summary' => array(
							'type' => 'string',
						),
					),
				),
			),
		);
	}

	/**
	 * Returns the schema for a form field item (string or object).
	 *
	 * @return array Schema for a form field.
	 */
	private function get_form_field_schema() {
		return array(
			'oneOf' => array(
				array( 'type' => 'string' ),
				array(
					'type'       => 'object',
					'properties' => array(
						'id'          => array(
							'type' => 'string',
						),
						'label'       => array(
							'type' => 'string',
						),
						'description' => array(
							'type' => 'string',
						),
						'layout'      => $this->get_form_layout_schema(),
						'children'    => array(
							'type'  => 'array',
							'items' => array(
								'oneOf' => array(
									array( 'type' => 'string' ),
									// This object can have the shape of a form field itself,
									// allowing for recursive nesting of form fields.
									// There's no easy way to codify this recursion via the JSON Schema draft-04
									// supported by the REST API.
									array( 'type' => 'object' ),
								),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Returns the schema for the form configuration object.
	 *
	 * @return array Schema properties for the form configuration.
	 */
	private function get_form_schema() {
		return array(
			'layout' => $this->get_form_layout_schema(),
			'fields' => array(
				'type'  => 'array',
				'items' => $this->get_form_field_schema(),
			),
		);
	}
}
