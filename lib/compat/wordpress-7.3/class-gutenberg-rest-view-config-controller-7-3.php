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
 * Extends the 7.2 controller to add the item count of each view in the `page`
 * view list.
 *
 * @since 7.3.0
 *
 * @see Gutenberg_REST_View_Config_Controller_7_2
 */
class Gutenberg_REST_View_Config_Controller_7_3 extends Gutenberg_REST_View_Config_Controller_7_2 {

	/**
	 * Returns the view configuration for the given entity type.
	 *
	 * Adds the item count of each view in the `page` view list. The counts are
	 * added here rather than through the view config filter, so that they are
	 * computed from the view list after every filter has changed it.
	 *
	 * @since 7.3.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$response = parent::get_items( $request );
		if ( is_wp_error( $response ) || 'postType' !== $request->get_param( 'kind' ) || 'page' !== $request->get_param( 'name' ) ) {
			return $response;
		}

		// Skip the counting when the request leaves out the view list, such as
		// the editor's request for the form alone.
		if ( ! rest_is_field_included( 'view_list', $this->get_fields_for_response( $request ) ) ) {
			return $response;
		}

		$data = $response->get_data();
		if ( is_array( $data['view_list'] ) ) {
			$data['view_list'] = _gutenberg_add_counts_to_view_list( 'page', $data['view_list'], $data['default_view'], $data['default_layouts'] );
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Retrieves the view configuration schema, conforming to JSON Schema.
	 *
	 * Adds the `count` of each entry in the view list, which get_items()
	 * provides.
	 *
	 * @since 7.3.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['view_list']['items']['properties']['count'] = array(
			'description' => __( 'Number of items the view holds.', 'gutenberg' ),
			'type'        => 'integer',
			'readonly'    => true,
		);

		return $schema;
	}
}
