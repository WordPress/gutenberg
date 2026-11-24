<?php
/**
 * REST API: Gutenberg_REST_View_Config_Controller_7_3 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides a REST endpoint for retrieving the default
 * view configuration for a given entity type.
 *
 * Extends the 7.2 controller to expose the `quick_edit_form` configuration,
 * the form of the quick edit drawer, and the `config` property of a form
 * field, which passes settings to the field's control.
 *
 * @since 7.3.0
 *
 * @see Gutenberg_REST_View_Config_Controller_7_2
 */
class Gutenberg_REST_View_Config_Controller_7_3 extends Gutenberg_REST_View_Config_Controller_7_2 {

	/**
	 * Returns the default view configuration for the given entity type.
	 *
	 * @since 7.3.0 Added the `quick_edit_form` configuration.
	 *
	 * @param WP_REST_Request<array<string, mixed>> $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$kind = $request->get_param( 'kind' );
		$name = $request->get_param( 'name' );

		// The route declares both as strings, so the REST API rejects anything else before this runs.
		if ( ! is_string( $kind ) || ! is_string( $name ) ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'The entity kind and name must be strings.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$config = gutenberg_add_form_fields_to_quick_edit_form( gutenberg_get_entity_view_config( $kind, $name ), $kind, $name );

		$response = array(
			'kind'    => $kind,
			'name'    => $name,
			'version' => Gutenberg_View_Config_Data::LATEST_VERSION,
		);

		foreach ( array( 'default_view', 'default_layouts', 'view_list', 'form', 'quick_edit_form' ) as $property ) {
			$response[ $property ] = gutenberg_prepare_json_value_for_client(
				$config[ $property ] ?? array(),
				$this->get_property_schema( $property )
			);
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Returns the schema of a top-level property of the item schema.
	 *
	 * @since 7.3.0
	 *
	 * @param string $property The property name.
	 * @return array<string, mixed> The property schema, or an empty array if the item schema has no such property.
	 */
	private function get_property_schema( $property ) {
		$schema     = $this->get_item_schema();
		$properties = $schema['properties'] ?? null;

		if ( ! is_array( $properties ) || ! isset( $properties[ $property ] ) || ! is_array( $properties[ $property ] ) ) {
			return array();
		}

		return self::with_string_keys( $properties[ $property ] );
	}

	/**
	 * Returns the entries of an array whose keys are strings, as schema objects have.
	 *
	 * @since 7.3.0
	 *
	 * @param array<mixed> $value The array.
	 * @return array<string, mixed> The entries with string keys.
	 */
	private static function with_string_keys( array $value ) {
		$result = array();
		foreach ( $value as $key => $entry ) {
			if ( is_string( $key ) ) {
				$result[ $key ] = $entry;
			}
		}
		return $result;
	}

	/**
	 * Retrieves the item's schema, conforming to JSON Schema.
	 *
	 * @since 7.3.0 Added the `quick_edit_form` property.
	 *
	 * @return array<string, mixed> Item schema data.
	 */
	public function get_item_schema() {
		if ( ! $this->schema ) {
			$schema     = parent::get_item_schema();
			$properties = isset( $schema['properties'] ) && is_array( $schema['properties'] ) ? $schema['properties'] : array();

			$properties['quick_edit_form'] = array(
				'description' => __( 'Form configuration of the quick edit drawer. Empty when the entity has none, in which case the drawer uses the default form configuration.', 'gutenberg' ),
				'type'        => 'object',
				'readonly'    => true,
				'properties'  => $this->get_form_schema(),
			);

			$schema['properties'] = $properties;
			$this->schema         = $schema;
		}

		$schema = $this->add_additional_fields_schema( $this->schema );

		return is_array( $schema ) ? self::with_string_keys( $schema ) : array();
	}

	/**
	 * Returns the schema for a form field item (string or object).
	 *
	 * @since 7.3.0 Added the `config` property.
	 *
	 * @return array<mixed> Schema for a form field.
	 */
	protected function get_form_field_schema() {
		$schema = parent::get_form_field_schema();

		if ( ! isset( $schema['oneOf'] ) || ! is_array( $schema['oneOf'] ) ) {
			return $schema;
		}

		$one_of = $schema['oneOf'];
		foreach ( $one_of as $index => $field ) {
			if ( ! is_array( $field ) || 'object' !== ( $field['type'] ?? null ) ) {
				continue;
			}

			$field_properties = isset( $field['properties'] ) && is_array( $field['properties'] ) ? $field['properties'] : array();

			$field_properties['config'] = array(
				'description' => __( 'Settings passed to the field control.', 'gutenberg' ),
				'type'        => 'object',
			);

			$field['properties'] = $field_properties;
			$one_of[ $index ]    = $field;
		}
		$schema['oneOf'] = $one_of;

		return $schema;
	}
}
