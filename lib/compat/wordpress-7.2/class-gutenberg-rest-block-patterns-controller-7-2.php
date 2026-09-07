<?php
/**
 * REST API: Gutenberg_REST_Block_Patterns_Controller_7_2 class
 *
 * @package gutenberg
 */

/**
 * Adds the `synced` field to the block patterns REST API.
 *
 * @see Gutenberg_REST_Block_Patterns_Controller_7_0
 */
class Gutenberg_REST_Block_Patterns_Controller_7_2 extends Gutenberg_REST_Block_Patterns_Controller_7_0 {
	/**
	 * Prepares a raw block pattern before it gets output in a REST API response.
	 *
	 * @param array           $item    Raw pattern as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$fields = $this->get_fields_for_response( $request );
		if ( rest_is_field_included( 'synced', $fields ) ) {
			$data           = $response->get_data();
			$data['synced'] = gutenberg_is_block_pattern_synced( $item );
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Retrieves the block pattern schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = parent::get_item_schema();

		$schema['properties']['synced'] = array(
			'description' => __( 'Whether inserting the pattern references it instead of copying its content.', 'gutenberg' ),
			'type'        => 'boolean',
			'readonly'    => true,
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
