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
		$form            = array();
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
			$default_layouts = $this->get_default_layouts_for_page();
			$default_view    = $this->get_default_view_for_page();
			$view_list       = $this->get_view_list_for_page( $all_items_title, $default_layouts );
			$form            = $this->get_form_for_page();
		} elseif ( 'postType' === $kind && 'post' === $name ) {
			$form = $this->get_form_for_page();
		} elseif ( 'postType' === $kind && 'wp_block' === $name ) {
			$default_layouts = $this->get_default_layouts_for_wp_block();
			$default_view    = $this->get_default_view_for_wp_block( $default_layouts );
			$view_list       = $this->get_view_list_for_wp_block();
		} elseif ( 'postType' === $kind && 'wp_template_part' === $name ) {
			$default_layouts = $this->get_default_layouts_for_wp_template_part();
			$default_view    = $this->get_default_view_for_wp_template_part( $default_layouts );
			$view_list       = $this->get_view_list_for_wp_template_part();
		} elseif ( 'postType' === $kind && 'wp_template' === $name ) {
			$default_view    = $this->get_default_view_for_wp_template();
			$default_layouts = $this->get_default_layouts_for_wp_template();
			$view_list       = $this->get_view_list_for_wp_template();
		}

		$response = array(
			'kind'            => $kind,
			'name'            => $name,
			'default_view'    => $default_view,
			'default_layouts' => $default_layouts,
			'view_list'       => $view_list,
			'form'            => $form,
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

	private function get_default_view_for_page() {
		return array(
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
	}

	private function get_default_layouts_for_page() {
		return array(
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

	private function get_form_for_page() {
		return array(
			'layout' => array( 'type' => 'panel' ),
			'fields' => array(
				array(
					'id'     => 'featured_media',
					'layout' => array(
						'type'          => 'regular',
						'labelPosition' => 'none',
					),
				),
				array(
					'id'     => 'post-content-info',
					'layout' => array(
						'type'          => 'regular',
						'labelPosition' => 'none',
					),
				),
				array(
					'id'     => 'excerpt',
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'top',
					),
				),
				array(
					'id'       => 'status',
					'label'    => __( 'Status', 'gutenberg' ),
					'children' => array(
						array(
							'id'     => 'status',
							'layout' => array(
								'type'          => 'regular',
								'labelPosition' => 'none',
							),
						),
						'scheduled_date',
						'password',
						'sticky',
					),
				),
				'date',
				'slug',
				'author',
				'template',
				array(
					'id'       => 'discussion',
					'label'    => __( 'Discussion', 'gutenberg' ),
					'children' => array(
						array(
							'id'     => 'comment_status',
							'layout' => array(
								'type'          => 'regular',
								'labelPosition' => 'none',
							),
						),
						'ping_status',
					),
				),
				'parent',
				'format',
			),
		);
	}

	private function get_view_list_for_page( $all_items_title, $default_layouts ) {
		return array(
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
					'layout'  => $default_layouts['table']['layout'],
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

	private function get_default_layouts_for_wp_block() {
		return array(
			'table' => array(
				'layout' => array(
					'styles' => array(
						'author' => array(
							'width' => '1%',
						),
					),
				),
			),
			'grid'  => array(
				'layout' => array(
					'badgeFields' => array( 'sync-status' ),
				),
			),
		);
	}

	private function get_default_view_for_wp_block( $default_layouts ) {
		return array(
			'type'       => 'grid',
			'perPage'    => 20,
			'titleField' => 'title',
			'mediaField' => 'preview',
			'fields'     => array( 'sync-status' ),
			'filters'    => array(),
			'layout'     => $default_layouts['grid']['layout'],
		);
	}

	private function get_default_layouts_for_wp_template_part() {
		return array(
			'table' => array(
				'layout' => array(
					'styles' => array(
						'author' => array(
							'width' => '1%',
						),
					),
				),
			),
			'grid'  => array(
				'layout' => array(),
			),
		);
	}

	private function get_default_view_for_wp_template_part( $default_layouts ) {
		return array(
			'type'       => 'grid',
			'perPage'    => 20,
			'titleField' => 'title',
			'mediaField' => 'preview',
			'fields'     => array( 'author' ),
			'filters'    => array(),
			'layout'     => $default_layouts['grid']['layout'],
		);
	}

	/**
	 * Returns the original source of a template.
	 *
	 * @param WP_Block_Template $template_object Template instance.
	 * @return string The original source ('theme', 'plugin', 'site', or 'user').
	 */
	private static function get_wp_templates_original_source_field( $template_object ) {
		if ( 'wp_template' === $template_object->type || 'wp_template_part' === $template_object->type ) {
			/*
			 * Added by theme.
			 * Template originally provided by a theme, but customized by a user.
			 * Templates originally didn't have the 'origin' field so identify
			 * older customized templates by checking for no origin and a 'theme'
			 * or 'custom' source.
			 */
			if ( $template_object->has_theme_file &&
				( 'theme' === $template_object->origin || (
					empty( $template_object->origin ) && in_array(
						$template_object->source,
						array(
							'theme',
							'custom',
						),
						true
					) )
				)
			) {
				return 'theme';
			}

			// Added by plugin.
			if ( 'plugin' === $template_object->origin ) {
				return 'plugin';
			}

			/*
			 * Added by site.
			 * Template was created from scratch, but has no author. Author support
			 * was only added to templates in WordPress 5.9. Fallback to showing the
			 * site logo and title.
			 */
			if ( empty( $template_object->has_theme_file ) && 'custom' === $template_object->source && empty( $template_object->author ) ) {
				return 'site';
			}
		}

		// Added by user.
		return 'user';
	}

	/**
	 * Returns a human readable text for the author of a template.
	 *
	 * @param WP_Block_Template $template_object Template instance.
	 * @return string Human readable text for the author.
	 */
	private static function get_wp_templates_author_text_field( $template_object ) {
		$original_source = self::get_wp_templates_original_source_field( $template_object );
		switch ( $original_source ) {
			case 'theme':
				$theme_name = wp_get_theme( $template_object->theme )->get( 'Name' );
				return empty( $theme_name ) ? $template_object->theme : $theme_name;
			case 'plugin':
				if ( ! function_exists( 'get_plugins' ) ) {
					require_once ABSPATH . 'wp-admin/includes/plugin.php';
				}
				if ( isset( $template_object->plugin ) ) {
					$plugins = wp_get_active_and_valid_plugins();

					foreach ( $plugins as $plugin_file ) {
						$plugin_basename      = plugin_basename( $plugin_file );
						list( $plugin_slug, ) = explode( '/', $plugin_basename );

						if ( $plugin_slug === $template_object->plugin ) {
							$plugin_data = get_plugin_data( $plugin_file );

							if ( ! empty( $plugin_data['Name'] ) ) {
								return $plugin_data['Name'];
							}

							break;
						}
					}
				}

				/*
				 * Fall back to the theme name if the plugin is not defined. That's needed to keep backwards
				 * compatibility with templates that were registered before the plugin attribute was added.
				 */
				$plugins         = get_plugins();
				$plugin_basename = plugin_basename( sanitize_text_field( $template_object->theme . '.php' ) );
				if ( isset( $plugins[ $plugin_basename ] ) && isset( $plugins[ $plugin_basename ]['Name'] ) ) {
					return $plugins[ $plugin_basename ]['Name'];
				}
				return $template_object->plugin ?? $template_object->theme;
			case 'site':
				return get_bloginfo( 'name' );
			case 'user':
				$author = get_user_by( 'id', $template_object->author );
				if ( ! $author ) {
					return __( 'Unknown author', 'gutenberg' );
				}
				return $author->get( 'display_name' );
		}

		// Fail-safe to return a string should the original source ever fall through.
		return '';
	}

	/**
	 * Returns the view list for the wp_template_part post type.
	 *
	 * Builds entries from the registered template part areas (header, footer, etc.).
	 *
	 * @return array View list entries.
	 */
	private function get_view_list_for_wp_template_part() {
		$view_list = array(
			array(
				'title' => __( 'All template parts', 'gutenberg' ),
				'slug'  => 'all-parts',
			),
		);

		$areas = get_allowed_block_template_part_areas();

		// Ensure default areas appear in a consistent order.
		$preferred_order = array( 'header', 'footer', 'sidebar', 'navigation-overlay', 'uncategorized' );
		$ordered_areas   = array();
		$remaining_areas = array();
		foreach ( $areas as $area ) {
			$position = array_search( $area['area'], $preferred_order, true );
			if ( false !== $position ) {
				$ordered_areas[ $position ] = $area;
			} else {
				$remaining_areas[] = $area;
			}
		}
		ksort( $ordered_areas );
		$areas = array_merge( array_values( $ordered_areas ), $remaining_areas );

		foreach ( $areas as $area ) {
			$view_list[] = array(
				'title' => $area['label'],
				'slug'  => $area['area'],
				'view'  => array(
					'filters' => array(
						array(
							'field'    => 'area',
							'operator' => 'is',
							'value'    => $area['area'],
							'isLocked' => true,
						),
					),
				),
			);
		}

		return $view_list;
	}

	/**
	 * Returns the view list for the wp_block (patterns) post type.
	 *
	 * Builds entries from registered block pattern categories and user pattern categories.
	 *
	 * @return array View list entries.
	 */
	private function get_view_list_for_wp_block() {
		$view_list = array(
			array(
				'title' => __( 'All patterns', 'gutenberg' ),
				'slug'  => 'all-patterns',
			),
			array(
				'title' => __( 'My patterns', 'gutenberg' ),
				'slug'  => 'my-patterns',
			),
		);

		// Gather categories from the block pattern categories registry.
		$registry   = WP_Block_Pattern_Categories_Registry::get_instance();
		$categories = array();

		foreach ( $registry->get_all_registered() as $category ) {
			$categories[ $category['name'] ] = $category['label'];
		}

		// Ensure "Uncategorized" is always included for patterns
		// that have no category assigned.
		$categories['uncategorized'] ??= __( 'Uncategorized', 'gutenberg' );

		// Also gather user-created pattern categories (wp_pattern_category taxonomy).
		$user_terms = get_terms(
			array(
				'taxonomy'   => 'wp_pattern_category',
				'hide_empty' => false,
			)
		);

		if ( ! is_wp_error( $user_terms ) ) {
			foreach ( $user_terms as $term ) {
				$categories[ $term->slug ] = $term->name;
			}
		}

		// Sort categories alphabetically by label.
		asort( $categories, SORT_NATURAL | SORT_FLAG_CASE );

		foreach ( $categories as $name => $label ) {
			$view_list[] = array(
				'title' => $label,
				'slug'  => $name,
			);
		}

		return $view_list;
	}

	private function get_default_view_for_wp_template() {
		return array(
			'type'             => 'grid',
			'perPage'          => 20,
			'sort'             => array(
				'field'     => 'title',
				'direction' => 'asc',
			),
			'titleField'       => 'title',
			'descriptionField' => 'description',
			'mediaField'       => 'preview',
			'fields'           => array( 'author', 'active', 'slug', 'theme' ),
			'filters'          => array(),
			'showMedia'        => true,
		);
	}

	private function get_default_layouts_for_wp_template() {
		return array(
			'table' => array( 'showMedia' => false ),
			'grid'  => array( 'showMedia' => true ),
			'list'  => array( 'showMedia' => false ),
		);
	}

	private function get_view_list_for_wp_template() {
		$view_list = array(
			array(
				'title' => __( 'All templates', 'gutenberg' ),
				'slug'  => 'all',
			),
		);

		$templates = get_block_templates( array(), 'wp_template' );

		// Collect unique authors, tracking whether they come from a registered
		// source (theme, plugin, site) so we can sort those before user ones.
		$seen_authors       = array();
		$registered_authors = array();
		$user_authors       = array();
		foreach ( $templates as $template ) {
			$original_source = self::get_wp_templates_original_source_field( $template );
			$author_text     = self::get_wp_templates_author_text_field( $template );
			if ( ! empty( $author_text ) && ! isset( $seen_authors[ $author_text ] ) ) {
				$seen_authors[ $author_text ] = true;
				$entry                        = array(
					'title' => $author_text,
					'slug'  => $author_text,
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'author',
								'operator' => 'is',
								'value'    => $author_text,
								'isLocked' => true,
							),
						),
					),
				);
				if ( 'user' === $original_source ) {
					$user_authors[] = $entry;
				} else {
					$registered_authors[] = $entry;
				}
			}
		}

		$view_list = array_merge( $view_list, $registered_authors, $user_authors );

		return $view_list;
	}
}
