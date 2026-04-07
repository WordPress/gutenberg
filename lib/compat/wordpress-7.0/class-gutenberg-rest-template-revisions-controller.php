<?php
/**
 * REST API: Gutenberg_REST_Template_Revisions_Controller class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoint for template revisions.
 *
 * This overrides the core WP_REST_Template_Revisions_Controller to include the
 * `date` field in the response. The core controller delegates to
 * WP_REST_Templates_Controller which includes `modified` but not `date`.
 *
 * @see WP_REST_Template_Revisions_Controller
 */
class Gutenberg_REST_Template_Revisions_Controller extends WP_REST_Template_Revisions_Controller {
	/**
	 * Prepares the revision for the REST response.
	 *
	 * @param WP_Post         $item    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data         = $response->get_data();
			$data['date'] = $this->prepare_date_response( $item->post_date_gmt, $item->post_date );
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Retrieves the revision's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['date'] = array(
			'description' => __( 'The date the revision was published, in the site\'s timezone.' ),
			'type'        => 'string',
			'format'      => 'date-time',
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		return $schema;
	}
}
