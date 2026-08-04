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
			'type' => 'string',
			'readonly' => true,
		),
		'name' => array(
			'type' => 'string',
			'readonly' => true,
		),
		'version' => array(
			'type' => 'integer',
			'readonly' => true,
		),
		'default_view' => array(
			'type' => 'object',
			'readonly' => true,
			'properties' => array(
				'type' => array(
					'type' => 'string',
				),
				'layout' => array(
					'type' => 'object',
					'properties' => array(
						'styles' => array(
							'type' => 'object',
							'additionalProperties' => array(
								'type' => 'object',
								'properties' => array(
									'width' => array(
										'type' => array(
											'string',
											'number',
										),
									),
									'maxWidth' => array(
										'type' => array(
											'string',
											'number',
										),
									),
									'minWidth' => array(
										'type' => array(
											'string',
											'number',
										),
									),
									'align' => array(
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
							'type' => 'string',
							'enum' => array(
								'compact',
								'balanced',
								'comfortable',
							),
						),
						'enableMoving' => array(
							'type' => 'boolean',
						),
						'badgeFields' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'previewSize' => array(
							'type' => 'number',
						),
					),
				),
				'filters' => array(
					'type' => 'array',
					'items' => array(
						'type' => 'object',
						'properties' => array(
							'field' => array(
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
							'value' => array(),
							'isLocked' => array(
								'type' => 'boolean',
							),
						),
					),
				),
				'sort' => array(
					'type' => 'object',
					'properties' => array(
						'field' => array(
							'type' => 'string',
						),
						'direction' => array(
							'type' => 'string',
							'enum' => array(
								'asc',
								'desc',
							),
						),
					),
				),
				'perPage' => array(
					'type' => 'integer',
				),
				'fields' => array(
					'type' => 'array',
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
				'showTitle' => array(
					'type' => 'boolean',
				),
				'showMedia' => array(
					'type' => 'boolean',
				),
				'showDescription' => array(
					'type' => 'boolean',
				),
				'showLevels' => array(
					'type' => 'boolean',
				),
				'groupBy' => array(
					'type' => 'object',
					'properties' => array(
						'field' => array(
							'type' => 'string',
						),
						'direction' => array(
							'type' => 'string',
							'enum' => array(
								'asc',
								'desc',
							),
						),
						'showLabel' => array(
							'type' => 'boolean',
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
			'type' => 'object',
			'readonly' => true,
			'properties' => array(
				'table' => array(
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
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
									'value' => array(),
									'isLocked' => array(
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'type' => 'integer',
						),
						'fields' => array(
							'type' => 'array',
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
						'showTitle' => array(
							'type' => 'boolean',
						),
						'showMedia' => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
						'layout' => array(
							'type' => 'object',
							'properties' => array(
								'styles' => array(
									'type' => 'object',
									'additionalProperties' => array(
										'type' => 'object',
										'properties' => array(
											'width' => array(
												'type' => array(
													'string',
													'number',
												),
											),
											'maxWidth' => array(
												'type' => array(
													'string',
													'number',
												),
											),
											'minWidth' => array(
												'type' => array(
													'string',
													'number',
												),
											),
											'align' => array(
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
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
								'enableMoving' => array(
									'type' => 'boolean',
								),
							),
						),
					),
				),
				'list' => array(
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
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
									'value' => array(),
									'isLocked' => array(
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'type' => 'integer',
						),
						'fields' => array(
							'type' => 'array',
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
						'showTitle' => array(
							'type' => 'boolean',
						),
						'showMedia' => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
						'layout' => array(
							'type' => 'object',
							'properties' => array(
								'density' => array(
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
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
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
									'value' => array(),
									'isLocked' => array(
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'type' => 'integer',
						),
						'fields' => array(
							'type' => 'array',
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
						'showTitle' => array(
							'type' => 'boolean',
						),
						'showMedia' => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
						'layout' => array(
							'type' => 'object',
							'properties' => array(
								'badgeFields' => array(
									'type' => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
								'previewSize' => array(
									'type' => 'number',
								),
								'density' => array(
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
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
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
									'value' => array(),
									'isLocked' => array(
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'type' => 'integer',
						),
						'fields' => array(
							'type' => 'array',
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
						'showTitle' => array(
							'type' => 'boolean',
						),
						'showMedia' => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
						'layout' => array(
							'type' => 'object',
							'properties' => array(
								'density' => array(
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
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
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
									'value' => array(),
									'isLocked' => array(
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'type' => 'integer',
						),
						'fields' => array(
							'type' => 'array',
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
						'showTitle' => array(
							'type' => 'boolean',
						),
						'showMedia' => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
						'layout' => array(
							'type' => 'object',
							'properties' => array(
								'badgeFields' => array(
									'type' => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
								'previewSize' => array(
									'type' => 'number',
								),
								'density' => array(
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
					'type' => 'object',
					'properties' => array(
						'filters' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
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
									'value' => array(),
									'isLocked' => array(
										'type' => 'boolean',
									),
								),
							),
						),
						'sort' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
							),
						),
						'perPage' => array(
							'type' => 'integer',
						),
						'fields' => array(
							'type' => 'array',
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
						'showTitle' => array(
							'type' => 'boolean',
						),
						'showMedia' => array(
							'type' => 'boolean',
						),
						'showDescription' => array(
							'type' => 'boolean',
						),
						'showLevels' => array(
							'type' => 'boolean',
						),
						'groupBy' => array(
							'type' => 'object',
							'properties' => array(
								'field' => array(
									'type' => 'string',
								),
								'direction' => array(
									'type' => 'string',
									'enum' => array(
										'asc',
										'desc',
									),
								),
								'showLabel' => array(
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'infiniteScrollEnabled' => array(
							'type' => 'boolean',
						),
						'layout' => array(
							'type' => 'object',
							'properties' => array(
								'styles' => array(
									'type' => 'object',
									'additionalProperties' => array(
										'type' => 'object',
										'properties' => array(
											'width' => array(
												'type' => array(
													'string',
													'number',
												),
											),
											'maxWidth' => array(
												'type' => array(
													'string',
													'number',
												),
											),
											'minWidth' => array(
												'type' => array(
													'string',
													'number',
												),
											),
											'align' => array(
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
									'type' => 'string',
									'enum' => array(
										'compact',
										'balanced',
										'comfortable',
									),
								),
								'enableMoving' => array(
									'type' => 'boolean',
								),
							),
						),
					),
				),
			),
		),
		'view_list' => array(
			'type' => 'array',
			'readonly' => true,
			'items' => array(
				'type' => 'object',
				'properties' => array(
					'title' => array(
						'type' => 'string',
					),
					'slug' => array(
						'type' => 'string',
					),
					'view' => array(
						'type' => 'object',
						'properties' => array(
							'type' => array(
								'type' => 'string',
							),
							'layout' => array(
								'type' => 'object',
								'properties' => array(
									'styles' => array(
										'type' => 'object',
										'additionalProperties' => array(
											'type' => 'object',
											'properties' => array(
												'width' => array(
													'type' => array(
														'string',
														'number',
													),
												),
												'maxWidth' => array(
													'type' => array(
														'string',
														'number',
													),
												),
												'minWidth' => array(
													'type' => array(
														'string',
														'number',
													),
												),
												'align' => array(
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
										'type' => 'string',
										'enum' => array(
											'compact',
											'balanced',
											'comfortable',
										),
									),
									'enableMoving' => array(
										'type' => 'boolean',
									),
									'badgeFields' => array(
										'type' => 'array',
										'items' => array(
											'type' => 'string',
										),
									),
									'previewSize' => array(
										'type' => 'number',
									),
								),
							),
							'filters' => array(
								'type' => 'array',
								'items' => array(
									'type' => 'object',
									'properties' => array(
										'field' => array(
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
										'value' => array(),
										'isLocked' => array(
											'type' => 'boolean',
										),
									),
								),
							),
							'sort' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'type' => 'string',
									),
									'direction' => array(
										'type' => 'string',
										'enum' => array(
											'asc',
											'desc',
										),
									),
								),
							),
							'perPage' => array(
								'type' => 'integer',
							),
							'fields' => array(
								'type' => 'array',
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
							'showTitle' => array(
								'type' => 'boolean',
							),
							'showMedia' => array(
								'type' => 'boolean',
							),
							'showDescription' => array(
								'type' => 'boolean',
							),
							'showLevels' => array(
								'type' => 'boolean',
							),
							'groupBy' => array(
								'type' => 'object',
								'properties' => array(
									'field' => array(
										'type' => 'string',
									),
									'direction' => array(
										'type' => 'string',
										'enum' => array(
											'asc',
											'desc',
										),
									),
									'showLabel' => array(
										'type' => 'boolean',
										'default' => true,
									),
								),
							),
							'infiniteScrollEnabled' => array(
								'type' => 'boolean',
							),
						),
					),
				),
			),
		),
		'form' => array(
			'type' => 'object',
			'readonly' => true,
			'properties' => array(
				'layout' => array(
					'oneOf' => array(
						array(
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'type' => 'string',
									'enum' => array(
										'regular',
									),
								),
								'labelPosition' => array(
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
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'type' => 'string',
									'enum' => array(
										'panel',
									),
								),
								'labelPosition' => array(
									'type' => 'string',
									'enum' => array(
										'top',
										'side',
										'none',
									),
								),
								'openAs' => array(
									'oneOf' => array(
										array(
											'type' => 'string',
											'enum' => array(
												'dropdown',
												'modal',
											),
										),
										array(
											'type' => 'object',
											'properties' => array(
												'type' => array(
													'type' => 'string',
													'enum' => array(
														'dropdown',
														'modal',
													),
												),
												'applyLabel' => array(
													'type' => 'string',
												),
												'cancelLabel' => array(
													'type' => 'string',
												),
											),
										),
									),
								),
								'summary' => array(
									'oneOf' => array(
										array(
											'type' => 'string',
										),
										array(
											'type' => 'array',
											'items' => array(
												'type' => 'string',
											),
										),
									),
								),
								'editVisibility' => array(
									'type' => 'string',
									'enum' => array(
										'always',
										'on-hover',
									),
								),
							),
						),
						array(
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'type' => 'string',
									'enum' => array(
										'card',
									),
								),
								'withHeader' => array(
									'type' => 'boolean',
								),
								'isOpened' => array(
									'type' => 'boolean',
								),
								'isCollapsible' => array(
									'type' => 'boolean',
								),
								'summary' => array(
									'oneOf' => array(
										array(
											'type' => 'string',
										),
										array(
											'type' => 'array',
											'items' => array(
												'oneOf' => array(
													array(
														'type' => 'string',
													),
													array(
														'type' => 'object',
														'properties' => array(
															'id' => array(
																'type' => 'string',
															),
															'visibility' => array(
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
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'type' => 'string',
									'enum' => array(
										'row',
									),
								),
								'alignment' => array(
									'type' => 'string',
									'enum' => array(
										'start',
										'center',
										'end',
									),
								),
								'styles' => array(
									'type' => 'object',
									'additionalProperties' => array(
										'type' => 'object',
										'properties' => array(
											'flex' => array(
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
							'type' => 'object',
							'properties' => array(
								'type' => array(
									'type' => 'string',
									'enum' => array(
										'details',
									),
								),
								'summary' => array(
									'type' => 'string',
								),
							),
						),
					),
				),
				'fields' => array(
					'type' => 'array',
					'items' => array(
						'oneOf' => array(
							array(
								'type' => 'string',
							),
							array(
								'type' => 'object',
								'properties' => array(
									'id' => array(
										'type' => 'string',
									),
									'label' => array(
										'type' => 'string',
									),
									'description' => array(
										'type' => 'string',
									),
									'layout' => array(
										'oneOf' => array(
											array(
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'type' => 'string',
														'enum' => array(
															'regular',
														),
													),
													'labelPosition' => array(
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
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'type' => 'string',
														'enum' => array(
															'panel',
														),
													),
													'labelPosition' => array(
														'type' => 'string',
														'enum' => array(
															'top',
															'side',
															'none',
														),
													),
													'openAs' => array(
														'oneOf' => array(
															array(
																'type' => 'string',
																'enum' => array(
																	'dropdown',
																	'modal',
																),
															),
															array(
																'type' => 'object',
																'properties' => array(
																	'type' => array(
																		'type' => 'string',
																		'enum' => array(
																			'dropdown',
																			'modal',
																		),
																	),
																	'applyLabel' => array(
																		'type' => 'string',
																	),
																	'cancelLabel' => array(
																		'type' => 'string',
																	),
																),
															),
														),
													),
													'summary' => array(
														'oneOf' => array(
															array(
																'type' => 'string',
															),
															array(
																'type' => 'array',
																'items' => array(
																	'type' => 'string',
																),
															),
														),
													),
													'editVisibility' => array(
														'type' => 'string',
														'enum' => array(
															'always',
															'on-hover',
														),
													),
												),
											),
											array(
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'type' => 'string',
														'enum' => array(
															'card',
														),
													),
													'withHeader' => array(
														'type' => 'boolean',
													),
													'isOpened' => array(
														'type' => 'boolean',
													),
													'isCollapsible' => array(
														'type' => 'boolean',
													),
													'summary' => array(
														'oneOf' => array(
															array(
																'type' => 'string',
															),
															array(
																'type' => 'array',
																'items' => array(
																	'oneOf' => array(
																		array(
																			'type' => 'string',
																		),
																		array(
																			'type' => 'object',
																			'properties' => array(
																				'id' => array(
																					'type' => 'string',
																				),
																				'visibility' => array(
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
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'type' => 'string',
														'enum' => array(
															'row',
														),
													),
													'alignment' => array(
														'type' => 'string',
														'enum' => array(
															'start',
															'center',
															'end',
														),
													),
													'styles' => array(
														'type' => 'object',
														'additionalProperties' => array(
															'type' => 'object',
															'properties' => array(
																'flex' => array(
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
												'type' => 'object',
												'properties' => array(
													'type' => array(
														'type' => 'string',
														'enum' => array(
															'details',
														),
													),
													'summary' => array(
														'type' => 'string',
													),
												),
											),
										),
									),
									'children' => array(
										'type' => 'array',
										'items' => array(
											'oneOf' => array(
												array(
													'type' => 'string',
												),
												array(
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
