<?php
/**
 * REST API: Gutenberg_REST_Settings_Controller class
 *
 * @package gutenberg
 */

class Gutenberg_REST_Settings_Controller extends WP_REST_Settings_Controller {
	/**
	 * Retrieves all of the registered options for the Settings API.
	 *
	 * @since 4.7.0
	 *
	 * @return array Array of registered options.
	 */
	protected function get_registered_options() {
		$rest_options = array();

		foreach ( get_registered_settings() as $name => $args ) {
			if ( empty( $args['show_in_rest'] ) ) {
				continue;
			}

			$rest_args = array();

			if ( is_array( $args['show_in_rest'] ) ) {
				$rest_args = $args['show_in_rest'];
			}

			$defaults = array(
				'name'   => ! empty( $rest_args['name'] ) ? $rest_args['name'] : $name,
				'schema' => array(),
			);

			$rest_args = array_merge( $defaults, $rest_args );

			$default_schema = array(
				'type'        => empty( $args['type'] ) ? null : $args['type'],
				'label'       => empty( $args['label'] ) ? '' : $args['label'], // Note: Only change to the method.
				'description' => empty( $args['description'] ) ? '' : $args['description'],
				'default'     => isset( $args['default'] ) ? $args['default'] : null,
			);

			$rest_args['schema']      = array_merge( $default_schema, $rest_args['schema'] );
			$rest_args['option_name'] = $name;

			// Skip over settings that don't have a defined type in the schema.
			if ( empty( $rest_args['schema']['type'] ) ) {
				continue;
			}

			/*
			 * Allow the supported types for settings, as we don't want invalid types
			 * to be updated with arbitrary values that we can't do decent sanitizing for.
			 */
			if ( ! in_array( $rest_args['schema']['type'], array( 'number', 'integer', 'string', 'boolean', 'array', 'object' ), true ) ) {
				continue;
			}

			$rest_args['schema'] = rest_default_additional_properties_to_false( $rest_args['schema'] );

			$rest_options[ $rest_args['name'] ] = $rest_args;
		}

		// Note: The `label` is available in schema here, but is missing from the `OPTIONS` response.

		return $rest_options;
	}
}
