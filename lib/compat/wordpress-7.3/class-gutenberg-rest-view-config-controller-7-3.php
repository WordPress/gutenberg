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
			'default_view'    => gutenberg_prepare_json_value_for_client( $config['default_view'], $schema['properties']['default_view'] ),
			'default_layouts' => gutenberg_prepare_json_value_for_client( $config['default_layouts'], $schema['properties']['default_layouts'] ),
			'view_list'       => gutenberg_prepare_json_value_for_client( $config['view_list'], $schema['properties']['view_list'] ),
			'form'            => gutenberg_prepare_json_value_for_client( $config['form'], $schema['properties']['form'] ),
			'quick_edit_form' => gutenberg_prepare_json_value_for_client( $config['quick_edit_form'] ?? array(), $schema['properties']['quick_edit_form'] ),
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves the item's schema, conforming to JSON Schema.
	 *
	 * @since 7.3.0 Added the `quick_edit_form` property.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		parent::get_item_schema();

		$this->schema['properties']['quick_edit_form'] = array(
			'description' => __( 'Form configuration of the quick edit drawer. Empty when the entity has none, in which case the drawer uses the default form configuration.', 'gutenberg' ),
			'type'        => 'object',
			'readonly'    => true,
			'properties'  => $this->get_form_schema(),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Returns the schema for a form field item (string or object).
	 *
	 * @since 7.3.0 Added the `config` property.
	 *
	 * @return array Schema for a form field.
	 */
	protected function get_form_field_schema() {
		$schema = parent::get_form_field_schema();

		foreach ( $schema['oneOf'] as $index => $field ) {
			if ( 'object' === $field['type'] ) {
				$schema['oneOf'][ $index ]['properties']['config'] = array(
					'description' => __( 'Settings passed to the field control.', 'gutenberg' ),
					'type'        => 'object',
				);
			}
		}

		return $schema;
	}
}
