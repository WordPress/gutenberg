<?php
/**
 * The view config REST item schema, conforming to JSON Schema draft-04.
 *
 * This file is the canonical schema for the view config endpoint. It is
 * consumed independently by two readers:
 *
 * - `Gutenberg_REST_View_Config_Controller_7_1::get_item_schema()`, which
 *   requires it at request time.
 * - `npm run docs:view-config-ref` (via `tools/docs/dump-view-config-schema.php`),
 *   which requires it outside of a WordPress runtime to generate
 *   `docs/reference-guides/view-config-reference.md`.
 *
 * Because the docs generator loads it without WordPress, this file MUST stay
 * loadable outside WordPress: it may not use any WordPress API except `__()`
 * for the property descriptions, and it must contain nothing but the schema —
 * the file `return`s the complete item schema array.
 *
 * @package gutenberg
 */

/*
 * Schema properties shared by all view types (ViewBase), excluding `type`.
 *
 * Note that `search` and `page` are not part of the schema: they are managed
 * via the URL, which is their only source of truth.
 */
$view_base_properties = array(
	'filters'               => array(
		'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be removed by the user.', 'gutenberg' ),
		'type'        => 'array',
		'items'       => array(
			'type'       => 'object',
			'properties' => array(
				'field'    => array(
					'description' => __( 'Id of the field to filter by.', 'gutenberg' ),
					'type'        => 'string',
				),
				'operator' => array(
					'description' => __( 'The filter operator to use.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array(
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
				'value'    => array(
					'description' => __( 'The value to filter by.', 'gutenberg' ),
				),
				'isLocked' => array(
					'description' => __( 'Whether the filter is locked, preventing the user from editing or removing it.', 'gutenberg' ),
					'type'        => 'boolean',
				),
			),
		),
	),
	'sort'                  => array(
		'description' => __( 'The sorting configuration: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
		'type'        => 'object',
		'properties'  => array(
			'field'     => array(
				'description' => __( 'Id of the field to sort by.', 'gutenberg' ),
				'type'        => 'string',
			),
			'direction' => array(
				'description' => __( 'The direction to sort by.', 'gutenberg' ),
				'type'        => 'string',
				'enum'        => array( 'asc', 'desc' ),
			),
		),
	),
	'perPage'               => array(
		'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
		'type'        => 'integer',
	),
	'fields'                => array(
		'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
		'type'        => 'array',
		'items'       => array(
			'type' => 'string',
		),
	),
	'titleField'            => array(
		'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
		'type'        => 'string',
	),
	'mediaField'            => array(
		'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
		'type'        => 'string',
	),
	'descriptionField'      => array(
		'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
		'type'        => 'string',
	),
	'showTitle'             => array(
		'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
		'type'        => 'boolean',
	),
	'showMedia'             => array(
		'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
		'type'        => 'boolean',
	),
	'showDescription'       => array(
		'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
		'type'        => 'boolean',
	),
	'showLevels'            => array(
		'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
		'type'        => 'boolean',
	),
	'groupBy'               => array(
		'description' => __( 'The grouping configuration: the field id, the direction the groups are sorted by (`asc` or `desc`), and whether the group header shows the field label.', 'gutenberg' ),
		'type'        => 'object',
		'properties'  => array(
			'field'     => array(
				'description' => __( 'Id of the field to group by.', 'gutenberg' ),
				'type'        => 'string',
			),
			'direction' => array(
				'description' => __( 'The direction the groups are sorted by.', 'gutenberg' ),
				'type'        => 'string',
				'enum'        => array( 'asc', 'desc' ),
			),
			'showLabel' => array(
				'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
				'type'        => 'boolean',
				'default'     => true,
			),
		),
	),
	'infiniteScrollEnabled' => array(
		'description' => __( 'Whether records load via infinite scroll instead of pagination.', 'gutenberg' ),
		'type'        => 'boolean',
	),
);

// Schema for the ColumnStyle type.
$column_style_schema = array(
	'description' => __( 'Style of a table column.', 'gutenberg' ),
	'type'        => 'object',
	'properties'  => array(
		'width'    => array(
			'description' => __( 'The width of the column.', 'gutenberg' ),
			'type'        => array( 'string', 'number' ),
		),
		'maxWidth' => array(
			'description' => __( 'The maximum width of the column.', 'gutenberg' ),
			'type'        => array( 'string', 'number' ),
		),
		'minWidth' => array(
			'description' => __( 'The minimum width of the column.', 'gutenberg' ),
			'type'        => array( 'string', 'number' ),
		),
		'align'    => array(
			'description' => __( 'The alignment of the column content. Defaults to `start`.', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array( 'start', 'center', 'end' ),
		),
	),
);

// Layout schema for table-type views (ViewTable, ViewPickerTable).
$table_layout_schema = array(
	'description' => __( 'Layout options specific to table-type views.', 'gutenberg' ),
	'type'        => 'object',
	'properties'  => array(
		'styles'       => array(
			'description'          => __( 'Styles for the table columns, keyed by field id.', 'gutenberg' ),
			'type'                 => 'object',
			'additionalProperties' => $column_style_schema,
		),
		'density'      => array(
			'description' => __( 'The density of the layout.', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array( 'compact', 'balanced', 'comfortable' ),
		),
		'enableMoving' => array(
			'description' => __( 'Whether the table columns display moving controls.', 'gutenberg' ),
			'type'        => 'boolean',
		),
	),
);

// Layout schema for list-type views (ViewList, ViewActivity).
$list_layout_schema = array(
	'description' => __( 'Layout options specific to list-type views.', 'gutenberg' ),
	'type'        => 'object',
	'properties'  => array(
		'density' => array(
			'description' => __( 'The density of the layout.', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array( 'compact', 'balanced', 'comfortable' ),
		),
	),
);

// Layout schema for grid-type views (ViewGrid, ViewPickerGrid).
$grid_layout_schema = array(
	'description' => __( 'Layout options specific to grid-type views.', 'gutenberg' ),
	'type'        => 'object',
	'properties'  => array(
		'badgeFields' => array(
			'description' => __( 'Ids of the fields rendered without label and styled as badges.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		),
		'previewSize' => array(
			'description' => __( 'The size of the grid item preview.', 'gutenberg' ),
			'type'        => 'number',
		),
		'density'     => array(
			'description' => __( 'The density of the layout.', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array( 'compact', 'balanced', 'comfortable' ),
		),
	),
);

/*
 * A combined layout schema that accepts properties from all view types.
 *
 * This is useful for contexts where the view type is not known ahead of time
 * (e.g. the `view` override in a view list item), so all possible layout
 * properties must be accepted.
 */
$combined_layout_schema = array(
	'description' => __( 'Configuration specific to the selected layout type. Accepts the layout options of all view types.', 'gutenberg' ),
	'type'        => 'object',
	'properties'  => array_merge(
		$table_layout_schema['properties'],
		$grid_layout_schema['properties'],
		$list_layout_schema['properties']
	),
);

/*
 * Schema for a form layout object as a discriminated union.
 *
 * Each variant is discriminated by a single-value enum on its `type` property,
 * matching the TypeScript Layout union in dataviews/src/types/dataform.ts.
 */
$form_layout_schema = array(
	'description' => __( 'The layout used to render the fields: one of the `regular`, `panel`, `card`, `row`, or `details` variants, discriminated by its `type` property.', 'gutenberg' ),
	'oneOf'       => array(
		// RegularLayout.
		array(
			'description' => __( 'The `regular` layout renders the fields inline.', 'gutenberg' ),
			'type'        => 'object',
			'properties'  => array(
				'type'          => array(
					'description' => __( 'The layout type.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'regular' ),
				),
				'labelPosition' => array(
					'description' => __( 'Position of the field label. Defaults to `top`.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'top', 'side', 'none' ),
				),
			),
		),
		// PanelLayout.
		array(
			'description' => __( 'The `panel` layout renders each field as a button that opens a dropdown or modal editor.', 'gutenberg' ),
			'type'        => 'object',
			'properties'  => array(
				'type'           => array(
					'description' => __( 'The layout type.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'panel' ),
				),
				'labelPosition'  => array(
					'description' => __( 'Position of the field label. Defaults to `side`.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'top', 'side', 'none' ),
				),
				'openAs'         => array(
					'description' => __( 'Whether the panel editor opens as a dropdown or a modal. The object form also configures the labels of the modal buttons. Defaults to `dropdown`.', 'gutenberg' ),
					'oneOf'       => array(
						array(
							'type' => 'string',
							'enum' => array( 'dropdown', 'modal' ),
						),
						array(
							'type'       => 'object',
							'properties' => array(
								'type'        => array(
									'description' => __( 'The editor type the panel opens as.', 'gutenberg' ),
									'type'        => 'string',
									'enum'        => array( 'dropdown', 'modal' ),
								),
								'applyLabel'  => array(
									'description' => __( 'Label of the apply button when the panel opens as a modal.', 'gutenberg' ),
									'type'        => 'string',
								),
								'cancelLabel' => array(
									'description' => __( 'Label of the cancel button when the panel opens as a modal.', 'gutenberg' ),
									'type'        => 'string',
								),
							),
						),
					),
				),
				'summary'        => array(
					'description' => __( 'Id or ids of the fields displayed in the panel header.', 'gutenberg' ),
					'oneOf'       => array(
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
					'description' => __( 'When the edit controls are visible. Defaults to `on-hover`.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'always', 'on-hover' ),
				),
			),
		),
		// CardLayout.
		array(
			'description' => __( 'The `card` layout renders the fields inside a card, optionally collapsible behind a header.', 'gutenberg' ),
			'type'        => 'object',
			'properties'  => array(
				'type'          => array(
					'description' => __( 'The layout type.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'card' ),
				),
				'withHeader'    => array(
					'description' => __( 'Whether the card renders a header. Defaults to `true`.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'isOpened'      => array(
					'description' => __( 'Whether the card is expanded. Defaults to `true`.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'isCollapsible' => array(
					'description' => __( 'Whether the card can be collapsed. Defaults to `true`.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'summary'       => array(
					'description' => __( 'Id or ids of the fields displayed in the card header. Object entries control the visibility of each summary field (`always` or `when-collapsed`).', 'gutenberg' ),
					'oneOf'       => array(
						array( 'type' => 'string' ),
						array(
							'type'  => 'array',
							'items' => array(
								'oneOf' => array(
									array( 'type' => 'string' ),
									array(
										'type'       => 'object',
										'properties' => array(
											'id'         => array(
												'description' => __( 'Id of the summary field.', 'gutenberg' ),
												'type'        => 'string',
											),
											'visibility' => array(
												'description' => __( 'When the summary field is shown: always, or only when the card is collapsed. Defaults to `when-collapsed`.', 'gutenberg' ),
												'type'        => 'string',
												'enum'        => array( 'always', 'when-collapsed' ),
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
			'description' => __( 'The `row` layout renders the fields horizontally in a single row.', 'gutenberg' ),
			'type'        => 'object',
			'properties'  => array(
				'type'      => array(
					'description' => __( 'The layout type.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'row' ),
				),
				'alignment' => array(
					'description' => __( 'Alignment of the fields within the row. Defaults to `center`.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'start', 'center', 'end' ),
				),
				'styles'    => array(
					'description'          => __( 'Styles for the fields in the row, keyed by field id. The `flex` property of each entry controls how the field sizes within the row.', 'gutenberg' ),
					'type'                 => 'object',
					'additionalProperties' => array(
						'type'       => 'object',
						'properties' => array(
							'flex' => array(
								'description' => __( 'Any valid CSS `flex` value, controlling how the field sizes within the row.', 'gutenberg' ),
								'type'        => array( 'string', 'number' ),
							),
						),
					),
				),
			),
		),
		// DetailsLayout.
		array(
			'description' => __( 'The `details` layout renders the fields inside a collapsible details element.', 'gutenberg' ),
			'type'        => 'object',
			'properties'  => array(
				'type'    => array(
					'description' => __( 'The layout type.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'details' ),
				),
				'summary' => array(
					'description' => __( 'Text shown in the details disclosure summary.', 'gutenberg' ),
					'type'        => 'string',
				),
			),
		),
	),
);

// Schema for a form field item (string or object).
$form_field_schema = array(
	'description' => __( 'A form field: a field id, or an object for further configuration.', 'gutenberg' ),
	'oneOf'       => array(
		array(
			'description' => __( 'Id of the field.', 'gutenberg' ),
			'type'        => 'string',
		),
		array(
			'description' => __( 'A form field configuration object.', 'gutenberg' ),
			'type'        => 'object',
			'properties'  => array(
				'id'          => array(
					'description' => __( 'Id of the field. Used as the member identity when merging patches.', 'gutenberg' ),
					'type'        => 'string',
				),
				'label'       => array(
					'description' => __( "Label displayed for the field, overriding the field's own.", 'gutenberg' ),
					'type'        => 'string',
				),
				'description' => array(
					'description' => __( "A description of the form field's purpose, used to provide additional context.", 'gutenberg' ),
					'type'        => 'string',
				),
				'layout'      => array_merge(
					$form_layout_schema,
					array(
						'description' => __( 'The layout used to render this field, overriding the form layout.', 'gutenberg' ),
					)
				),
				'children'    => array(
					'description' => __( 'Fields combined under this entry, following the same shape as `fields`.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array(
						'oneOf' => array(
							array(
								'description' => __( 'Id of the field.', 'gutenberg' ),
								'type'        => 'string',
							),
							// This object can have the shape of a form field itself,
							// allowing for recursive nesting of form fields.
							// There's no easy way to codify this recursion via the JSON Schema draft-04
							// supported by the REST API.
							array(
								'description' => __( 'A nested form field configuration object.', 'gutenberg' ),
								'type'        => 'object',
							),
						),
					),
				),
			),
		),
	),
);

// Schema properties for the form configuration object.
$form_properties = array(
	'layout' => array_merge(
		$form_layout_schema,
		array(
			'description' => __( 'The default layout for the form fields.', 'gutenberg' ),
		)
	),
	'fields' => array(
		'description' => __( 'The fields of the form, in display order. Each entry is a field id, or an object for further configuration.', 'gutenberg' ),
		'type'        => 'array',
		'items'       => $form_field_schema,
	),
);

return array(
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
		'version'         => array(
			'description' => __( 'The schema version of the configuration.', 'gutenberg' ),
			'type'        => 'integer',
			'readonly'    => true,
		),
		'default_view'    => array(
			'description' => __( 'Default view configuration.', 'gutenberg' ),
			'type'        => 'object',
			'readonly'    => true,
			'properties'  => array_merge(
				array(
					'type'   => array(
						'description' => __( 'The layout type (e.g. `table`, `grid`, `list`, or `activity`).', 'gutenberg' ),
						'type'        => 'string',
					),
					'layout' => $combined_layout_schema,
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
					'description' => __( 'View overrides applied when the table layout is selected.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array_merge(
						$view_base_properties,
						array(
							'layout' => $table_layout_schema,
						)
					),
				),
				'list'        => array(
					'description' => __( 'View overrides applied when the list layout is selected.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array_merge(
						$view_base_properties,
						array(
							'layout' => $list_layout_schema,
						)
					),
				),
				'grid'        => array(
					'description' => __( 'View overrides applied when the grid layout is selected.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array_merge(
						$view_base_properties,
						array(
							'layout' => $grid_layout_schema,
						)
					),
				),
				'activity'    => array(
					'description' => __( 'View overrides applied when the activity layout is selected.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array_merge(
						$view_base_properties,
						array(
							'layout' => $list_layout_schema,
						)
					),
				),
				'pickerGrid'  => array(
					'description' => __( 'View overrides applied when the picker grid layout is selected.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array_merge(
						$view_base_properties,
						array(
							'layout' => $grid_layout_schema,
						)
					),
				),
				'pickerTable' => array(
					'description' => __( 'View overrides applied when the picker table layout is selected.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array_merge(
						$view_base_properties,
						array(
							'layout' => $table_layout_schema,
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
						'description' => __( 'Title of the view, displayed in the sidebar.', 'gutenberg' ),
						'type'        => 'string',
					),
					'slug'  => array(
						'description' => __( 'Unique identifier for the view. Used as the member identity when merging patches.', 'gutenberg' ),
						'type'        => 'string',
					),
					'view'  => array(
						'description' => __( 'Partial view configuration applied on top of the default view when the view is selected.', 'gutenberg' ),
						'type'        => 'object',
						'properties'  => array_merge(
							array(
								'type'   => array(
									'description' => __( 'The layout type (e.g. `table`, `grid`, `list`, or `activity`).', 'gutenberg' ),
									'type'        => 'string',
								),
								'layout' => $combined_layout_schema,
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
			'properties'  => $form_properties,
		),
	),
);
