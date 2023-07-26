<?php
/**
 * REST API: Gutenberg_REST_Block_Types_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Core class used to access block types via the REST API.
 *
 * @since 6.4.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Block_Types_Controller extends WP_REST_Block_Types_Controller {
	/**
	 * Prepare a raw block pattern before it gets output in a REST API response.
	 *
	 * @todo In the long run, we'd likely want to have a filter in the `WP_Block_Patterns_Registry` class
	 * instead to allow us plugging in code like this.
	 *
	 * @param array           $item    Raw pattern as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		if ( ! gutenberg_is_experiment_enabled( 'gutenberg-auto-inserting-blocks' ) ) {
			return $response;
		}

		// Restores the more descriptive, specific name for use within this method.
		$block_type = $item;
		$fields     = $this->get_fields_for_response( $request );
		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';

		if ( rest_is_field_included( 'auto_insert', $fields ) ) {
			// if ( isset( $block_type->$extra_field ) ) {
			// 	$field = $block_type->$extra_field;
			// }
			$schema = $this->get_item_schema();
			$data = $response->get_data();
			$data['auto_insert'] = array( 'a' => 'b' );
			$data    = $this->add_additional_fields_to_object( $data, $request );
			$data    = $this->filter_response_by_context( $data, $context );
			//$data['auto_insert'] = rest_sanitize_value_from_schema( $field, $schema['properties'][ 'auto_insert' ] );
		}

		// $blocks          = parse_blocks( $data['content'] );
		// $data['content'] = gutenberg_serialize_blocks( $blocks ); // Serialize or render?

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$this->schema = parent::get_item_schema();

		$auto_insert_schema = array(
			'description' => __( 'Auto-insertion.' ),
			'type'        => 'object',
			'default'     => array(),
			'properties'  => array(),
			'context'     => array( 'embed', 'view', 'edit' ),
			'readonly'    => true,
		);

		$this->schema['properties'] = array_merge(
			$this->schema['properties'],
			array(
				'auto_insert' => $auto_insert_schema,
			)
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
