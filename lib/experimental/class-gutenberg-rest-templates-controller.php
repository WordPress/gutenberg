<?php
/**
 * WP_REST_Templates_Controller class
 *
 * @package gutenberg
 */

 class Gutenberg_Experimental_REST_Templates_Controller extends WP_REST_Templates_Controller {
	/**
	 * Add revisions to the response.
	 *
	 * @param WP_Block_Template $item    Template instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$template = $item;

		$response = parent::prepare_item_for_response( $item, $request );
		$data = $response->get_data();
		$fields = $this->get_fields_for_response( $request );

		if ( ! is_null( $template->wp_id ) && $template->wp_id !== 0 ) {
			$revisions = wp_get_latest_revision_id_and_total_count( $template->wp_id );
		} else {
			// TODO: Should this be included if it's a file-based template?
			$revisions = array(
				'count' => 0,
				'latest_id' => 0,
			);
		}

		if ( rest_is_field_included( 'revision_count', $fields ) ) {
			$data['revision_count'] = (int) $revisions['count'];
		}

		if ( rest_is_field_included( 'latest_revision_id', $fields ) ) {
			$data['latest_revision_id'] = (int) $revisions['latest_id'];
		}

		$response->set_data( $data );
		return $response;
	}

	/**
	 * Adds revision_count and latest_revision_id to the template schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['revision_count'] = array(
			'description' => __( 'The number of revisions of the template.' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		$schema['properties']['latest_revision_id'] = array(
			'description' => __( 'The id of the latest revision of the template.' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		return $schema;
	}
}