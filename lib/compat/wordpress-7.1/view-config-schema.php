<?php
/**
 * The REST schema of the `/wp/v2/view-config` endpoint.
 *
 * GENERATED FILE — DO NOT EDIT. Regenerate from the canonical JSON Schema
 * at schemas/json/view-config.json with:
 *
 *     node tools/docs/gen-view-config-schema-php.mjs
 *
 * @package gutenberg
 */

// phpcs:ignoreFile

return array(
	'$schema' => 'http://json-schema.org/draft-04/schema#',
	'title' => 'view-config',
	'type' => 'object',
	'properties' => array(
		'kind' => array(
			'description' => __( 'Entity kind (e.g. `postType`).', 'gutenberg' ),
			'type' => 'string',
			'readonly' => true,
		),
		'name' => array(
			'description' => __( 'Entity name (e.g. `page`).', 'gutenberg' ),
			'type' => 'string',
			'readonly' => true,
		),
		'version' => array(
			'description' => __( 'The schema version (currently, 1).', 'gutenberg' ),
			'type' => 'integer',
			'readonly' => true,
		),
		'default_view' => array(
			'description' => __( 'The default DataViews configuration for the screen: layout type, visible fields, sorting, filtering, and pagination.', 'gutenberg' ),
			'type' => 'object',
			'readonly' => true,
			'properties' => array(
				'type' => array(
					'description' => __( 'The layout type.', 'gutenberg' ),
					'type' => 'string',
					'enum' => array(
						'table',
						'grid',
						'list',
						'activity',
						'pickerGrid',
						'pickerTable',
					),
				),
				'layout' => array(
					'description' => __( 'Configuration specific to the selected layout type. Accepts the `layout` options of any layout type; see [`default_layouts`](#default_layouts).', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'styles' => array(
							'description' => __( 'The styles for the columns, keyed by field id. Each column style accepts `width`, `maxWidth`, and `minWidth` (a CSS value or a number of pixels) and `align` (`start`, `center`, or `end`).', 'gutenberg' ),
							'type' => 'object',
							'additionalProperties' => array(
								'description' => __( 'The style of a single field column.', 'gutenberg' ),
								'type' => 'object',
								'properties' => array(
									'width' => array(
										'description' => __( 'The width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
										'type' => array(
											'string',
											'number',
										),
									),
									'maxWidth' => array(
										'description' => __( 'The maximum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
										'type' => array(
											'string',
											'number',
										),
									),
									'minWidth' => array(
										'description' => __( 'The minimum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
										'type' => array(
											'string',
											'number',
										),
									),
									'align' => array(
										'description' => __( 'The alignment of the field column: `start`, `center`, or `end`. Defaults to `start`.', 'gutenberg' ),
										'type' => 'string',
										'enum' => array(
											'start',
											'center',
											'end',
										),
									),
								),
							),
						),
						'density' => array(
							'description' => __( 'The density of the layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
							'type' => 'string',
							'enum' => array(
								'compact',
								'balanced',
								'comfortable',
							),
						),
						'enableMoving' => array(
							'description' => __( 'Whether the user can reorder columns.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'badgeFields' => array(
							'description' => __( 'Ids of the fields to display as badges instead of regular fields.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'previewSize' => array(
							'description' => __( 'The preview size of the grid.', 'gutenberg' ),
							'type' => 'number',
						),
					),
				),
				'filters' => array(
					'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
					'type' => 'array',
					'items' => array(
						'type' => 'object',
						'properties' => array(
							'field' => array(
								'description' => __( 'The field to filter by.', 'gutenberg' ),
								'type' => 'string',
							),
							'operator' => array(
								'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
							'value' => array(
								'description' => __( 'The value to filter by.', 'gutenberg' ),
							),
							'isLocked' => array(
								'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
								'type' => 'boolean',
							),
						),
					),
				),
				'sort' => array(
					'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'field' => array(
							'description' => __( 'The field to sort by.', 'gutenberg' ),
							'type' => 'string',
						),
						'direction' => array(
							'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
							'type' => 'string',
							'enum' => array(
								'asc',
								'desc',
							),
						),
					),
				),
				'perPage' => array(
					'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
					'type' => 'integer',
				),
				'fields' => array(
					'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
					'type' => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
				'titleField' => array(
					'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
					'type' => 'string',
				),
				'mediaField' => array(
					'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
					'type' => 'string',
				),
				'descriptionField' => array(
					'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
					'type' => 'string',
				),
				'showTitle' => array(
					'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
					'type' => 'boolean',
				),
				'showMedia' => array(
					'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
					'type' => 'boolean',
				),
				'showDescription' => array(
					'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
					'type' => 'boolean',
				),
				'showLevels' => array(
					'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
					'type' => 'boolean',
				),
				'groupBy' => array(
					'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'field' => array(
							'description' => __( 'The field to group by.', 'gutenberg' ),
							'type' => 'string',
						),
						'direction' => array(
							'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
							'type' => 'string',
							'enum' => array(
								'asc',
								'desc',
							),
						),
						'showLabel' => array(
							'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
							'type' => 'boolean',
							'default' => true,
						),
					),
				),
				'infiniteScrollEnabled' => array(
					'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
					'type' => 'boolean',
				),
			),
		),
		'default_layouts' => array(
			'description' => __( 'The layout types the user can switch between, and the view overrides each one applies.', 'gutenberg' ),
			'type' => 'object',
			'readonly' => true,
			'properties' => array(
				'table' => array(
					'description' => __( 'View overrides applied when the table layout is selected.', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to filter by.', 'gutenberg' ),
										'type' => 'string',
									),
									'operator' => array(
										'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
									'value' => array(
										'description' => __( 'The value to filter by.', 'gutenberg' ),
									),
									'isLocked' => array(
										'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to sort by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
							'type' => 'integer',
						),
						'fields' => array(
							'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
							'type' => 'string',
						),
						'mediaField' => array(
							'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
							'type' => 'string',
						),
						'descriptionField' => array(
							'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
							'type' => 'string',
						),
						'showTitle' => array(
							'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showMedia' => array(
							'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showDescription' => array(
							'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showLevels' => array(
							'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'groupBy' => array(
							'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to group by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'layout' => array(
							'description' => __( 'Options specific to table-type layouts (`table`, `pickerTable`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'styles' => array(
									'description' => __( 'The styles for the columns, keyed by field id. Each column style accepts `width`, `maxWidth`, and `minWidth` (a CSS value or a number of pixels) and `align` (`start`, `center`, or `end`).', 'gutenberg' ),
									'type' => 'object',
									'additionalProperties' => array(
										'description' => __( 'The style of a single field column.', 'gutenberg' ),
										'type' => 'object',
										'properties' => array(
											'width' => array(
												'description' => __( 'The width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
											'maxWidth' => array(
												'description' => __( 'The maximum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
											'minWidth' => array(
												'description' => __( 'The minimum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
											'align' => array(
												'description' => __( 'The alignment of the field column: `start`, `center`, or `end`. Defaults to `start`.', 'gutenberg' ),
												'type' => 'string',
												'enum' => array(
													'start',
													'center',
													'end',
												),
											),
										),
									),
								),
								'density' => array(
									'description' => __( 'The density of the layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
								'enableMoving' => array(
									'description' => __( 'Whether the user can reorder columns.', 'gutenberg' ),
									'type' => 'boolean',
								),
							),
						),
					),
				),
				'list' => array(
					'description' => __( 'View overrides applied when the list layout is selected.', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to filter by.', 'gutenberg' ),
										'type' => 'string',
									),
									'operator' => array(
										'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
									'value' => array(
										'description' => __( 'The value to filter by.', 'gutenberg' ),
									),
									'isLocked' => array(
										'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to sort by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
							'type' => 'integer',
						),
						'fields' => array(
							'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
							'type' => 'string',
						),
						'mediaField' => array(
							'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
							'type' => 'string',
						),
						'descriptionField' => array(
							'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
							'type' => 'string',
						),
						'showTitle' => array(
							'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showMedia' => array(
							'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showDescription' => array(
							'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showLevels' => array(
							'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'groupBy' => array(
							'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to group by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'layout' => array(
							'description' => __( 'Options specific to list-type layouts (`list`, `activity`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'density' => array(
									'description' => __( 'The density of the layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
							),
						),
					),
				),
				'grid' => array(
					'description' => __( 'View overrides applied when the grid layout is selected.', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to filter by.', 'gutenberg' ),
										'type' => 'string',
									),
									'operator' => array(
										'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
									'value' => array(
										'description' => __( 'The value to filter by.', 'gutenberg' ),
									),
									'isLocked' => array(
										'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to sort by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
							'type' => 'integer',
						),
						'fields' => array(
							'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
							'type' => 'string',
						),
						'mediaField' => array(
							'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
							'type' => 'string',
						),
						'descriptionField' => array(
							'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
							'type' => 'string',
						),
						'showTitle' => array(
							'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showMedia' => array(
							'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showDescription' => array(
							'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showLevels' => array(
							'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'groupBy' => array(
							'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to group by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'layout' => array(
							'description' => __( 'Options specific to grid-type layouts (`grid`, `pickerGrid`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'badgeFields' => array(
									'description' => __( 'Ids of the fields to display as badges instead of regular fields.', 'gutenberg' ),
									'type' => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
								'previewSize' => array(
									'description' => __( 'The preview size of the grid.', 'gutenberg' ),
									'type' => 'number',
								),
								'density' => array(
									'description' => __( 'The density of the grid layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
							),
						),
					),
				),
				'activity' => array(
					'description' => __( 'View overrides applied when the activity layout is selected.', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to filter by.', 'gutenberg' ),
										'type' => 'string',
									),
									'operator' => array(
										'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
									'value' => array(
										'description' => __( 'The value to filter by.', 'gutenberg' ),
									),
									'isLocked' => array(
										'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to sort by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
							'type' => 'integer',
						),
						'fields' => array(
							'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
							'type' => 'string',
						),
						'mediaField' => array(
							'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
							'type' => 'string',
						),
						'descriptionField' => array(
							'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
							'type' => 'string',
						),
						'showTitle' => array(
							'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showMedia' => array(
							'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showDescription' => array(
							'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showLevels' => array(
							'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'groupBy' => array(
							'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to group by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'layout' => array(
							'description' => __( 'Options specific to list-type layouts (`list`, `activity`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'density' => array(
									'description' => __( 'The density of the layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
							),
						),
					),
				),
				'pickerGrid' => array(
					'description' => __( 'View overrides applied when the grid layout of a picker (DataViewsPicker) is selected.', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to filter by.', 'gutenberg' ),
										'type' => 'string',
									),
									'operator' => array(
										'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
									'value' => array(
										'description' => __( 'The value to filter by.', 'gutenberg' ),
									),
									'isLocked' => array(
										'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to sort by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
							'type' => 'integer',
						),
						'fields' => array(
							'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
							'type' => 'string',
						),
						'mediaField' => array(
							'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
							'type' => 'string',
						),
						'descriptionField' => array(
							'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
							'type' => 'string',
						),
						'showTitle' => array(
							'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showMedia' => array(
							'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showDescription' => array(
							'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showLevels' => array(
							'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'groupBy' => array(
							'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to group by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'layout' => array(
							'description' => __( 'Options specific to grid-type layouts (`grid`, `pickerGrid`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'badgeFields' => array(
									'description' => __( 'Ids of the fields to display as badges instead of regular fields.', 'gutenberg' ),
									'type' => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
								'previewSize' => array(
									'description' => __( 'The preview size of the grid.', 'gutenberg' ),
									'type' => 'number',
								),
								'density' => array(
									'description' => __( 'The density of the grid layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
							),
						),
					),
				),
				'pickerTable' => array(
					'description' => __( 'View overrides applied when the table layout of a picker (DataViewsPicker) is selected.', 'gutenberg' ),
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to filter by.', 'gutenberg' ),
										'type' => 'string',
									),
									'operator' => array(
										'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
									'value' => array(
										'description' => __( 'The value to filter by.', 'gutenberg' ),
									),
									'isLocked' => array(
										'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to sort by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
							'type' => 'integer',
						),
						'fields' => array(
							'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'titleField' => array(
							'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
							'type' => 'string',
						),
						'mediaField' => array(
							'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
							'type' => 'string',
						),
						'descriptionField' => array(
							'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
							'type' => 'string',
						),
						'showTitle' => array(
							'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showMedia' => array(
							'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showDescription' => array(
							'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'showLevels' => array(
							'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'groupBy' => array(
							'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'description' => __( 'The field to group by.', 'gutenberg' ),
									'type' => 'string',
								),
								'direction' => array(
									'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
							'type' => 'boolean',
						),
						'layout' => array(
							'description' => __( 'Options specific to table-type layouts (`table`, `pickerTable`).', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'styles' => array(
									'description' => __( 'The styles for the columns, keyed by field id. Each column style accepts `width`, `maxWidth`, and `minWidth` (a CSS value or a number of pixels) and `align` (`start`, `center`, or `end`).', 'gutenberg' ),
									'type' => 'object',
									'additionalProperties' => array(
										'description' => __( 'The style of a single field column.', 'gutenberg' ),
										'type' => 'object',
										'properties' => array(
											'width' => array(
												'description' => __( 'The width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
											'maxWidth' => array(
												'description' => __( 'The maximum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
											'minWidth' => array(
												'description' => __( 'The minimum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
											'align' => array(
												'description' => __( 'The alignment of the field column: `start`, `center`, or `end`. Defaults to `start`.', 'gutenberg' ),
												'type' => 'string',
												'enum' => array(
													'start',
													'center',
													'end',
												),
											),
										),
									),
								),
								'density' => array(
									'description' => __( 'The density of the layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
								'enableMoving' => array(
									'description' => __( 'Whether the user can reorder columns.', 'gutenberg' ),
									'type' => 'boolean',
								),
							),
						),
					),
				),
			),
		),
		'view_list' => array(
			'description' => __( 'The preconfigured views displayed in the screen\'s sidebar.', 'gutenberg' ),
			'type' => 'array',
			'readonly' => true,
			'items' => array(
				'type' => 'object',
				'properties' => array(
					'title' => array(
						'description' => __( 'Title of the view, displayed in the sidebar.', 'gutenberg' ),
						'type' => 'string',
					),
					'slug' => array(
						'description' => __( 'Unique identifier for the view. Used as the member identity when merging patches.', 'gutenberg' ),
						'type' => 'string',
					),
					'view' => array(
						'description' => __( 'Partial view configuration applied on top of [`default_view`](#default_view) when the view is selected — typically locked `filters`, but any view property works. Optional.', 'gutenberg' ),
						'type' => 'object',
						'properties' => array(
							'type' => array(
								'description' => __( 'The layout type, one of `table`, `grid`, `list`, `activity`, `pickerGrid`, or `pickerTable`.', 'gutenberg' ),
								'type' => 'string',
							),
							'layout' => array(
								'description' => __( 'Configuration specific to the selected layout type. Accepts the `layout` options of any layout type; see [`default_layouts`](#default_layouts).', 'gutenberg' ),
								'type' => 'object',
								'properties' => array(
									'styles' => array(
										'description' => __( 'The styles for the columns, keyed by field id. Each column style accepts `width`, `maxWidth`, and `minWidth` (a CSS value or a number of pixels) and `align` (`start`, `center`, or `end`).', 'gutenberg' ),
										'type' => 'object',
										'additionalProperties' => array(
											'description' => __( 'The style of a single field column.', 'gutenberg' ),
											'type' => 'object',
											'properties' => array(
												'width' => array(
													'description' => __( 'The width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
													'type' => array(
														'string',
														'number',
													),
												),
												'maxWidth' => array(
													'description' => __( 'The maximum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
													'type' => array(
														'string',
														'number',
													),
												),
												'minWidth' => array(
													'description' => __( 'The minimum width of the field column, as a CSS value or a number of pixels.', 'gutenberg' ),
													'type' => array(
														'string',
														'number',
													),
												),
												'align' => array(
													'description' => __( 'The alignment of the field column: `start`, `center`, or `end`. Defaults to `start`.', 'gutenberg' ),
													'type' => 'string',
													'enum' => array(
														'start',
														'center',
														'end',
													),
												),
											),
										),
									),
									'density' => array(
										'description' => __( 'The density of the layout: `compact`, `balanced`, or `comfortable`.', 'gutenberg' ),
										'type' => 'string',
										'enum' => array(
											'compact',
											'balanced',
											'comfortable',
										),
									),
									'enableMoving' => array(
										'description' => __( 'Whether the user can reorder columns.', 'gutenberg' ),
										'type' => 'boolean',
									),
									'badgeFields' => array(
										'description' => __( 'Ids of the fields to display as badges instead of regular fields.', 'gutenberg' ),
										'type' => 'array',
										'items' => array(
											'type' => 'string',
										),
									),
									'previewSize' => array(
										'description' => __( 'The preview size of the grid.', 'gutenberg' ),
										'type' => 'number',
									),
								),
							),
							'filters' => array(
								'description' => __( 'Filters applied to the dataset. A filter with `isLocked` set cannot be changed or removed by the user.', 'gutenberg' ),
								'type' => 'array',
								'items' => array(
									'type' => 'object',
									'properties' => array(
										'field' => array(
											'description' => __( 'The field to filter by.', 'gutenberg' ),
											'type' => 'string',
										),
										'operator' => array(
											'description' => __( 'The operator to use, one of `is`, `isNot`, `isAny`, `isNone`, `isAll`, `isNotAll`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, or `after`.', 'gutenberg' ),
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
										'value' => array(
											'description' => __( 'The value to filter by.', 'gutenberg' ),
										),
										'isLocked' => array(
											'description' => __( 'Whether the filter is locked. A locked filter cannot be changed or removed by the user.', 'gutenberg' ),
											'type' => 'boolean',
										),
									),
								),
							),
							'sort' => array(
								'description' => __( 'The default sort: the field id and the direction (`asc` or `desc`).', 'gutenberg' ),
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to sort by.', 'gutenberg' ),
										'type' => 'string',
									),
									'direction' => array(
										'description' => __( 'The direction to sort by, `asc` or `desc`.', 'gutenberg' ),
										'type' => 'string',
										'enum' => array(
											'asc',
											'desc',
										),
									),
								),
							),
							'perPage' => array(
								'description' => __( 'Number of records per page. Also used as the batch size when infinite scroll is enabled.', 'gutenberg' ),
								'type' => 'integer',
							),
							'fields' => array(
								'description' => __( 'Ids of the fields that are visible, in display order.', 'gutenberg' ),
								'type' => 'array',
								'items' => array(
									'type' => 'string',
								),
							),
							'titleField' => array(
								'description' => __( 'Id of the field used as the record title.', 'gutenberg' ),
								'type' => 'string',
							),
							'mediaField' => array(
								'description' => __( 'Id of the field used as the record media (e.g. featured image or preview).', 'gutenberg' ),
								'type' => 'string',
							),
							'descriptionField' => array(
								'description' => __( 'Id of the field used as the record description.', 'gutenberg' ),
								'type' => 'string',
							),
							'showTitle' => array(
								'description' => __( 'Whether the title is shown. Defaults to `true`.', 'gutenberg' ),
								'type' => 'boolean',
							),
							'showMedia' => array(
								'description' => __( 'Whether the media is shown. Defaults to `true`.', 'gutenberg' ),
								'type' => 'boolean',
							),
							'showDescription' => array(
								'description' => __( 'Whether the description is shown. Defaults to `true`.', 'gutenberg' ),
								'type' => 'boolean',
							),
							'showLevels' => array(
								'description' => __( 'Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`.', 'gutenberg' ),
								'type' => 'boolean',
							),
							'groupBy' => array(
								'description' => __( 'The grouping configuration: the field to group by, the direction (`asc` or `desc`), and whether to show the field label in each group header (`showLabel`, defaults to `true`).', 'gutenberg' ),
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'description' => __( 'The field to group by.', 'gutenberg' ),
										'type' => 'string',
									),
									'direction' => array(
										'description' => __( 'The direction to sort the groups by, `asc` or `desc`.', 'gutenberg' ),
										'type' => 'string',
										'enum' => array(
											'asc',
											'desc',
										),
									),
									'showLabel' => array(
										'description' => __( 'Whether to show the field label in the group header.', 'gutenberg' ),
										'type' => 'boolean',
										'default' => true,
									),
								),
							),
							'infiniteScrollEnabled' => array(
								'description' => __( 'Whether infinite scroll is enabled instead of pagination.', 'gutenberg' ),
								'type' => 'boolean',
							),
						),
					),
				),
			),
		),
		'form' => array(
			'description' => __( 'The DataForm configuration for the Quick Edit form: which fields are displayed, in which order, and how each one is laid out.', 'gutenberg' ),
			'type' => 'object',
			'readonly' => true,
			'properties' => array(
				'layout' => array(
					'description' => __( 'The layout used to render the form fields, discriminated by its `type`. See the form layout types.', 'gutenberg' ),
					'oneOf' => array(
						array(
							'description' => __( 'The default layout: the field controls are rendered directly in the form, one after another.', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'description' => __( 'The layout type.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'regular',
									),
								),
								'labelPosition' => array(
									'description' => __( 'Position of the field label: `top`, `side`, or `none`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'top',
										'side',
										'none',
									),
								),
							),
						),
						array(
							'description' => __( 'The field is rendered as a button that opens a dropdown or modal with the field controls.', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'description' => __( 'The layout type.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'panel',
									),
								),
								'labelPosition' => array(
									'description' => __( 'Position of the field label: `top`, `side`, or `none`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'top',
										'side',
										'none',
									),
								),
								'openAs' => array(
									'description' => __( 'How the panel opens: as a `dropdown` or as a `modal`. The object form allows customizing the labels of the modal buttons.', 'gutenberg' ),
									'oneOf' => array(
										array(
											'description' => __( 'The type of container to open, `dropdown` or `modal`.', 'gutenberg' ),
											'type' => 'string',
											'enum' => array(
												'dropdown',
												'modal',
											),
										),
										array(
											'description' => __( 'The type of container to open, with custom labels for the modal buttons.', 'gutenberg' ),
											'type' => 'object',
											'properties' => array(
												'type' => array(
													'description' => __( 'The type of container to open, `dropdown` or `modal`.', 'gutenberg' ),
													'type' => 'string',
													'enum' => array(
														'dropdown',
														'modal',
													),
												),
												'applyLabel' => array(
													'description' => __( 'Label of the modal button that applies the changes.', 'gutenberg' ),
													'type' => 'string',
												),
												'cancelLabel' => array(
													'description' => __( 'Label of the modal button that discards the changes.', 'gutenberg' ),
													'type' => 'string',
												),
											),
										),
									),
								),
								'summary' => array(
									'description' => __( 'Id(s) of the field(s) whose values are rendered in the panel button.', 'gutenberg' ),
									'oneOf' => array(
										array(
											'description' => __( 'A single field id.', 'gutenberg' ),
											'type' => 'string',
										),
										array(
											'description' => __( 'A list of field ids.', 'gutenberg' ),
											'type' => 'array',
											'items' => array(
												'type' => 'string',
											),
										),
									),
								),
								'editVisibility' => array(
									'description' => __( 'When the edit button is visible: `always` or `on-hover`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'always',
										'on-hover',
									),
								),
							),
						),
						array(
							'description' => __( 'The fields are grouped in a card container.', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'description' => __( 'The layout type.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'card',
									),
								),
								'withHeader' => array(
									'description' => __( 'Whether the card renders a header. Defaults to `true`.', 'gutenberg' ),
									'type' => 'boolean',
								),
								'isOpened' => array(
									'description' => __( 'Whether the card content is opened. Defaults to `true`.', 'gutenberg' ),
									'type' => 'boolean',
								),
								'isCollapsible' => array(
									'description' => __( 'Whether the card can be collapsed by the user.', 'gutenberg' ),
									'type' => 'boolean',
								),
								'summary' => array(
									'description' => __( 'Id(s) of the field(s) whose values are rendered in the card header. An entry declared as an object controls when it is visible: `always` or `when-collapsed`.', 'gutenberg' ),
									'oneOf' => array(
										array(
											'description' => __( 'A single field id.', 'gutenberg' ),
											'type' => 'string',
										),
										array(
											'description' => __( 'A list of field ids, optionally with their visibility.', 'gutenberg' ),
											'type' => 'array',
											'items' => array(
												'oneOf' => array(
													array(
														'description' => __( 'A field id.', 'gutenberg' ),
														'type' => 'string',
													),
													array(
														'description' => __( 'A field id with its visibility.', 'gutenberg' ),
														'type' => 'object',
														'properties' => array(
															'id' => array(
																'description' => __( 'Id of the field.', 'gutenberg' ),
																'type' => 'string',
															),
															'visibility' => array(
																'description' => __( 'When the field value is visible in the card header: `always` or `when-collapsed`.', 'gutenberg' ),
																'type' => 'string',
																'enum' => array(
																	'always',
																	'when-collapsed',
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
						),
						array(
							'description' => __( 'The fields are rendered horizontally in a single row.', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'description' => __( 'The layout type.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'row',
									),
								),
								'alignment' => array(
									'description' => __( 'Vertical alignment of the fields in the row: `start`, `center`, or `end`.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'start',
										'center',
										'end',
									),
								),
								'styles' => array(
									'description' => __( 'The styles for the fields in the row, keyed by field id. Each style accepts a `flex` value controlling how the field grows or shrinks.', 'gutenberg' ),
									'type' => 'object',
									'additionalProperties' => array(
										'type' => 'object',
										'properties' => array(
											'flex' => array(
												'description' => __( 'The CSS `flex` value for the field.', 'gutenberg' ),
												'type' => array(
													'string',
													'number',
												),
											),
										),
									),
								),
							),
						),
						array(
							'description' => __( 'The fields are rendered inside a collapsible disclosure (details) element.', 'gutenberg' ),
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'description' => __( 'The layout type.', 'gutenberg' ),
									'type' => 'string',
									'enum' => array(
										'details',
									),
								),
								'summary' => array(
									'description' => __( 'Label displayed as the summary of the disclosure element.', 'gutenberg' ),
									'type' => 'string',
								),
							),
						),
					),
				),
				'fields' => array(
					'description' => __( 'The fields of the form, in display order. Each entry is a field id, or an object for further configuration.', 'gutenberg' ),
					'type' => 'array',
					'items' => array(
						'description' => __( 'A form field: a field id, or an object for further configuration.', 'gutenberg' ),
						'oneOf' => array(
							array(
								'description' => __( 'A field id.', 'gutenberg' ),
								'type' => 'string',
							),
							array(
								'description' => __( 'A form field with additional configuration.', 'gutenberg' ),
								'type' => 'object',
								'properties' => array(
									'id' => array(
										'description' => __( 'Id of the field. Used as the member identity when merging patches.', 'gutenberg' ),
										'type' => 'string',
									),
									'label' => array(
										'description' => __( 'Label displayed for the field, overriding the field\'s own.', 'gutenberg' ),
										'type' => 'string',
									),
									'description' => array(
										'description' => __( 'Description displayed for the field.', 'gutenberg' ),
										'type' => 'string',
									),
									'layout' => array(
										'description' => __( 'The layout used to render the form fields, discriminated by its `type`. See the form layout types.', 'gutenberg' ),
										'oneOf' => array(
											array(
												'description' => __( 'The default layout: the field controls are rendered directly in the form, one after another.', 'gutenberg' ),
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'description' => __( 'The layout type.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'regular',
														),
													),
													'labelPosition' => array(
														'description' => __( 'Position of the field label: `top`, `side`, or `none`.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'top',
															'side',
															'none',
														),
													),
												),
											),
											array(
												'description' => __( 'The field is rendered as a button that opens a dropdown or modal with the field controls.', 'gutenberg' ),
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'description' => __( 'The layout type.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'panel',
														),
													),
													'labelPosition' => array(
														'description' => __( 'Position of the field label: `top`, `side`, or `none`.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'top',
															'side',
															'none',
														),
													),
													'openAs' => array(
														'description' => __( 'How the panel opens: as a `dropdown` or as a `modal`. The object form allows customizing the labels of the modal buttons.', 'gutenberg' ),
														'oneOf' => array(
															array(
																'description' => __( 'The type of container to open, `dropdown` or `modal`.', 'gutenberg' ),
																'type' => 'string',
																'enum' => array(
																	'dropdown',
																	'modal',
																),
															),
															array(
																'description' => __( 'The type of container to open, with custom labels for the modal buttons.', 'gutenberg' ),
																'type' => 'object',
																'properties' => array(
																	'type' => array(
																		'description' => __( 'The type of container to open, `dropdown` or `modal`.', 'gutenberg' ),
																		'type' => 'string',
																		'enum' => array(
																			'dropdown',
																			'modal',
																		),
																	),
																	'applyLabel' => array(
																		'description' => __( 'Label of the modal button that applies the changes.', 'gutenberg' ),
																		'type' => 'string',
																	),
																	'cancelLabel' => array(
																		'description' => __( 'Label of the modal button that discards the changes.', 'gutenberg' ),
																		'type' => 'string',
																	),
																),
															),
														),
													),
													'summary' => array(
														'description' => __( 'Id(s) of the field(s) whose values are rendered in the panel button.', 'gutenberg' ),
														'oneOf' => array(
															array(
																'description' => __( 'A single field id.', 'gutenberg' ),
																'type' => 'string',
															),
															array(
																'description' => __( 'A list of field ids.', 'gutenberg' ),
																'type' => 'array',
																'items' => array(
																	'type' => 'string',
																),
															),
														),
													),
													'editVisibility' => array(
														'description' => __( 'When the edit button is visible: `always` or `on-hover`.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'always',
															'on-hover',
														),
													),
												),
											),
											array(
												'description' => __( 'The fields are grouped in a card container.', 'gutenberg' ),
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'description' => __( 'The layout type.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'card',
														),
													),
													'withHeader' => array(
														'description' => __( 'Whether the card renders a header. Defaults to `true`.', 'gutenberg' ),
														'type' => 'boolean',
													),
													'isOpened' => array(
														'description' => __( 'Whether the card content is opened. Defaults to `true`.', 'gutenberg' ),
														'type' => 'boolean',
													),
													'isCollapsible' => array(
														'description' => __( 'Whether the card can be collapsed by the user.', 'gutenberg' ),
														'type' => 'boolean',
													),
													'summary' => array(
														'description' => __( 'Id(s) of the field(s) whose values are rendered in the card header. An entry declared as an object controls when it is visible: `always` or `when-collapsed`.', 'gutenberg' ),
														'oneOf' => array(
															array(
																'description' => __( 'A single field id.', 'gutenberg' ),
																'type' => 'string',
															),
															array(
																'description' => __( 'A list of field ids, optionally with their visibility.', 'gutenberg' ),
																'type' => 'array',
																'items' => array(
																	'oneOf' => array(
																		array(
																			'description' => __( 'A field id.', 'gutenberg' ),
																			'type' => 'string',
																		),
																		array(
																			'description' => __( 'A field id with its visibility.', 'gutenberg' ),
																			'type' => 'object',
																			'properties' => array(
																				'id' => array(
																					'description' => __( 'Id of the field.', 'gutenberg' ),
																					'type' => 'string',
																				),
																				'visibility' => array(
																					'description' => __( 'When the field value is visible in the card header: `always` or `when-collapsed`.', 'gutenberg' ),
																					'type' => 'string',
																					'enum' => array(
																						'always',
																						'when-collapsed',
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
											),
											array(
												'description' => __( 'The fields are rendered horizontally in a single row.', 'gutenberg' ),
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'description' => __( 'The layout type.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'row',
														),
													),
													'alignment' => array(
														'description' => __( 'Vertical alignment of the fields in the row: `start`, `center`, or `end`.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'start',
															'center',
															'end',
														),
													),
													'styles' => array(
														'description' => __( 'The styles for the fields in the row, keyed by field id. Each style accepts a `flex` value controlling how the field grows or shrinks.', 'gutenberg' ),
														'type' => 'object',
														'additionalProperties' => array(
															'type' => 'object',
															'properties' => array(
																'flex' => array(
																	'description' => __( 'The CSS `flex` value for the field.', 'gutenberg' ),
																	'type' => array(
																		'string',
																		'number',
																	),
																),
															),
														),
													),
												),
											),
											array(
												'description' => __( 'The fields are rendered inside a collapsible disclosure (details) element.', 'gutenberg' ),
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'description' => __( 'The layout type.', 'gutenberg' ),
														'type' => 'string',
														'enum' => array(
															'details',
														),
													),
													'summary' => array(
														'description' => __( 'Label displayed as the summary of the disclosure element.', 'gutenberg' ),
														'type' => 'string',
													),
												),
											),
										),
									),
									'children' => array(
										'description' => __( 'Fields combined under this entry, following the same shape as `fields`.', 'gutenberg' ),
										'type' => 'array',
										'items' => array(
											'oneOf' => array(
												array(
													'description' => __( 'A field id.', 'gutenberg' ),
													'type' => 'string',
												),
												array(
													'description' => __( 'A nested form field, following the same shape as an object entry of `fields`.', 'gutenberg' ),
													'type' => 'object',
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
		),
	),
);
