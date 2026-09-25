<?php
/**
 * REST API: Gutenberg_REST_Fields_Controller_7_2 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides a REST endpoint for retrieving the fields
 * registered for a given entity type.
 *
 * The fields are the ones registered on the server on the
 * `gutenberg_fields_api_init` action: the serializable part of each field, plus
 * the script modules that provide the JavaScript parts (render callbacks,
 * components, value getters and setters), each with the ids of the fields
 * it applies to. The client merges both into the fields it derives itself.
 *
 * @since 7.2.0
 */
class Gutenberg_REST_Fields_Controller_7_2 extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'fields';
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
			),
			true // override existing route defined by core, if it exists
		);
	}

	/**
	 * Checks if a given request has access to read the fields of an entity.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$kind = $request->get_param( 'kind' );
		$name = $request->get_param( 'name' );

		$capability = $this->get_required_capability( $kind, $name );

		if ( null === $capability ) {
			return new WP_Error(
				'rest_fields_invalid_entity',
				__( 'Invalid entity kind or name.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		if ( ! current_user_can( $capability ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to read the fields of this entity.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Resolves the capability required to read the fields of an entity.
	 *
	 * Mirrors the view config endpoint, which gates the same entities: post
	 * types use their own `edit_posts` capability (which honors custom
	 * `capability_type` registrations), taxonomies use `manage_terms`, and
	 * root-level entities use `manage_options`. A post type or taxonomy that is
	 * not registered, or not exposed to the REST API, resolves to `null` so the
	 * request is treated as referencing an unknown entity.
	 *
	 * Any other kind falls back to `edit_posts`, so fields registered for a
	 * custom entity kind stay readable behind a baseline capability.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return string|null Capability required to read the fields, or null if
	 *                     the entity is not registered.
	 */
	protected function get_required_capability( $kind, $name ) {
		switch ( $kind ) {
			case 'postType':
				$post_type = get_post_type_object( $name );
				if ( $post_type && $post_type->show_in_rest ) {
					return $post_type->cap->edit_posts;
				}
				return null;

			case 'taxonomy':
				$taxonomy = get_taxonomy( $name );
				if ( $taxonomy && $taxonomy->show_in_rest ) {
					return $taxonomy->cap->manage_terms;
				}
				return null;

			case 'root':
				return 'manage_options';
		}

		return 'edit_posts';
	}

	/**
	 * Returns the fields registered for the given entity type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$kind = $request->get_param( 'kind' );
		$name = $request->get_param( 'name' );

		$field_schema = $this->get_field_schema();
		$fields       = array();
		foreach ( gutenberg_get_registered_fields( $kind, $name ) as $field ) {
			$fields[] = $this->cast_empty_objects( $field, $field_schema );
		}

		$script_modules = array();
		foreach ( gutenberg_get_registered_field_modules( $kind, $name ) as $module => $field_ids ) {
			$script_modules[] = array(
				'id'     => $module,
				'fields' => array_values( $field_ids ),
			);
		}

		$response = array(
			'kind'           => $kind,
			'name'           => $name,
			'fields'         => $fields,
			'script_modules' => $script_modules,
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Recursively casts empty arrays to objects where the schema types them as
	 * objects.
	 *
	 * PHP cannot distinguish an empty associative array from an empty list, so
	 * `json_encode()` always serializes `array()` as a JSON array (`[]`). The
	 * REST schema, however, types several values as objects, which must encode
	 * as `{}`. This walks the value against its schema and casts any empty,
	 * object-typed array to an object. Non-empty associative arrays already
	 * encode as objects, so they are left as arrays and only recursed into to
	 * fix any nested empty objects.
	 *
	 * Union schemas (`oneOf`/`anyOf`) are handled only for the empty-array case:
	 * an empty value is cast to an object when any branch allows an object. Such
	 * values are not recursed into, which is sufficient for the field schema
	 * where they never contain empty nested objects.
	 *
	 * @param mixed $value  The value to normalize.
	 * @param array $schema The schema node describing the value.
	 * @return mixed The normalized value, with empty object-typed arrays cast to objects.
	 */
	protected function cast_empty_objects( $value, $schema ) {
		if ( ! is_array( $value ) || ! is_array( $schema ) ) {
			return $value;
		}

		if ( isset( $schema['oneOf'] ) || isset( $schema['anyOf'] ) ) {
			$branches = isset( $schema['oneOf'] ) ? $schema['oneOf'] : $schema['anyOf'];
			if ( array() === $value ) {
				foreach ( $branches as $branch ) {
					if ( is_array( $branch ) && in_array( 'object', (array) ( isset( $branch['type'] ) ? $branch['type'] : array() ), true ) ) {
						return (object) array();
					}
				}
			}
			return $value;
		}

		$types = (array) ( isset( $schema['type'] ) ? $schema['type'] : array() );

		if ( in_array( 'array', $types, true ) && isset( $schema['items'] ) ) {
			foreach ( $value as $index => $item ) {
				$value[ $index ] = $this->cast_empty_objects( $item, $schema['items'] );
			}
			return $value;
		}

		if ( in_array( 'object', $types, true ) ) {
			if ( isset( $schema['properties'] ) ) {
				foreach ( $schema['properties'] as $property => $property_schema ) {
					if ( array_key_exists( $property, $value ) ) {
						$value[ $property ] = $this->cast_empty_objects( $value[ $property ], $property_schema );
					}
				}
			}
			if ( isset( $schema['additionalProperties'] ) && is_array( $schema['additionalProperties'] ) ) {
				foreach ( $value as $key => $item ) {
					if ( isset( $schema['properties'][ $key ] ) ) {
						continue;
					}
					$value[ $key ] = $this->cast_empty_objects( $item, $schema['additionalProperties'] );
				}
			}

			// Empty object-typed arrays must serialize as {} to match the schema.
			if ( array() === $value ) {
				return (object) array();
			}
		}

		return $value;
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
			'title'      => 'fields',
			'type'       => 'object',
			'properties' => array(
				'kind'           => array(
					'description' => __( 'Entity kind.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'name'           => array(
					'description' => __( 'Entity name.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'fields'         => array(
					'description' => __( 'The fields registered for the entity, in registration order.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'items'       => $this->get_field_schema(),
				),
				'script_modules' => array(
					'description' => __( 'The script modules providing the JavaScript parts of the fields, each with the ids of the fields it applies to.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'id'     => array(
								'description' => __( 'The id of the script module.', 'gutenberg' ),
								'type'        => 'string',
							),
							'fields' => array(
								'description' => __( 'The ids of the fields the script module applies to.', 'gutenberg' ),
								'type'        => 'array',
								'items'       => array(
									'type' => 'string',
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
	 * Returns the schema for a field definition.
	 *
	 * Describes the serializable subset of the DataViews Field API, see
	 * packages/dataviews/src/types/field-api.ts. The properties that are
	 * JavaScript callbacks or components (`render`, `sort`, `getValue`, …)
	 * come from the script modules and are not part of the definition.
	 * Additional properties are allowed, so a plugin can register a field
	 * with properties of its own that its script module understands.
	 *
	 * @return array Schema for a field definition.
	 */
	protected function get_field_schema() {
		$option_schema = array(
			'type'       => 'object',
			'properties' => array(
				'value'       => array(
					'description' => __( 'The value of the option.', 'gutenberg' ),
					'type'        => array( 'string', 'integer', 'number', 'boolean', 'null' ),
				),
				'label'       => array(
					'description' => __( 'The label of the option.', 'gutenberg' ),
					'type'        => 'string',
				),
				'description' => array(
					'description' => __( 'The description of the option.', 'gutenberg' ),
					'type'        => 'string',
				),
			),
		);

		return array(
			'type'                 => 'object',
			'properties'           => array(
				'id'                 => array(
					'description' => __( 'The unique identifier of the field.', 'gutenberg' ),
					'type'        => 'string',
				),
				'type'               => array(
					'description' => __( 'The type of the field.', 'gutenberg' ),
					'type'        => 'string',
				),
				'label'              => array(
					'description' => __( 'The label of the field.', 'gutenberg' ),
					'type'        => 'string',
				),
				'header'             => array(
					'description' => __( 'The header of the field. Defaults to the label.', 'gutenberg' ),
					'type'        => 'string',
				),
				'description'        => array(
					'description' => __( 'The description of the field.', 'gutenberg' ),
					'type'        => 'string',
				),
				'placeholder'        => array(
					'description' => __( 'The placeholder of the field.', 'gutenberg' ),
					'type'        => 'string',
				),
				'Edit'               => array(
					'description' => __( 'The control used to edit the field: the name of a control, or a control configuration.', 'gutenberg' ),
					'type'        => array( 'string', 'object' ),
				),
				'isValid'            => array(
					'description' => __( 'The validation rules of the field.', 'gutenberg' ),
					'type'        => 'object',
				),
				'isDisabled'         => array(
					'description' => __( 'Whether the field is disabled.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'enableSorting'      => array(
					'description' => __( 'Whether the field is sortable.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'enableGlobalSearch' => array(
					'description' => __( 'Whether the field is searchable.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'enableHiding'       => array(
					'description' => __( 'Whether the field can be hidden.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'elements'           => array(
					'description' => __( 'The options to pick from when using the field as a filter.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => $option_schema,
				),
				'filterBy'           => array(
					'description' => __( 'The filter configuration of the field, or false when the field cannot be filtered.', 'gutenberg' ),
					'type'        => array( 'object', 'boolean' ),
					'properties'  => array(
						'operators' => array(
							'type'  => 'array',
							'items' => array(
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
						),
						'isPrimary' => array(
							'type' => 'boolean',
						),
					),
				),
				'readOnly'           => array(
					'description' => __( 'Whether the field is read only.', 'gutenberg' ),
					'type'        => 'boolean',
				),
				'format'             => array(
					'description' => __( 'The display format of the field.', 'gutenberg' ),
					'type'        => 'object',
				),
			),
			'additionalProperties' => true,
		);
	}
}
