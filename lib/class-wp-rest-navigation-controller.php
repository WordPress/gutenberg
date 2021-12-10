<?php
/**
 * REST API: WP_REST_Navigation_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Core class to access navigation blocks via the REST API.
 *
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Navigation_Controller extends WP_REST_Posts_Controller {
	/**
	 * Retrieves the query params for collections of attachments.
	 *
	 * @return array Query parameters for the attachment collection as an array.
	 */
	public function get_collection_params() {
		$params                            = parent::get_collection_params();
		$params['status']['default']       = 'inherit';
		$params['status']['items']['enum'] = array( 'inherit', 'publish', 'trash' );

		return $params;
	}

	/**
	 * Retrieves the attachment's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema as an array.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = parent::get_item_schema();
		unset( $schema['properties']['password'] );
		$schema['properties']['status']['enum'] = array( 'inherit', 'publish', 'trash' );

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
