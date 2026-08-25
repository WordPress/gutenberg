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
			),
			true // override existing route defined by core, if it exists
		);
	}

	/**
	 * Checks if a given request has access to read view config.
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
				'rest_view_config_invalid_entity',
				__( 'Invalid entity kind or name.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		if ( ! current_user_can( $capability ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to read view config.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Resolves the capability required to read the view config for an entity.
	 *
	 * Known kinds map to the capability that gates managing that entity's list:
	 * post types use their own `edit_posts` capability (which honors custom
	 * `capability_type` registrations), taxonomies use `manage_terms`, and
	 * root-level entities use `manage_options`. A post type or taxonomy that is
	 * not registered, or not exposed to the REST API, resolves to `null` so the
	 * request is treated as referencing an unknown entity.
	 *
	 * Any other kind falls back to `edit_posts`. This keeps entities registered
	 * through the `get_entity_view_config_{$kind}_{$name}` filter readable behind
	 * a baseline capability.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return string|null Capability required to read the config, or null if the
	 *                     entity is not registered.
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
	 * Returns the default view configuration for the given entity type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$kind = $request->get_param( 'kind' );
		$name = $request->get_param( 'name' );

		$config = gutenberg_get_entity_view_config( $kind, $name );
		$schema = $this->get_item_schema();

		$response = array(
			'kind'            => $kind,
			'name'            => $name,
			'version'         => Gutenberg_View_Config_Data::LATEST_VERSION,
			'default_view'    => $this->cast_empty_objects( $config['default_view'], $schema['properties']['default_view'] ),
			'default_layouts' => $this->cast_empty_objects( $config['default_layouts'], $schema['properties']['default_layouts'] ),
			'view_list'       => $this->cast_empty_objects( $config['view_list'], $schema['properties']['view_list'] ),
			'form'            => $this->cast_empty_objects( $config['form'], $schema['properties']['form'] ),
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
	 * values are not recursed into, which is sufficient for the form schema
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
	 * The schema lives in a standalone file so that it can also be consumed
	 * outside of a WordPress runtime by the documentation generator
	 * (`npm run docs:view-config-ref`).
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( ! $this->schema ) {
			$this->schema = require __DIR__ . '/view-config-schema.php';
		}

		return $this->add_additional_fields_schema( $this->schema );
	}
}
