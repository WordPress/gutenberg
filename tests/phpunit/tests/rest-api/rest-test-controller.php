<?php
/**
 * Unit tests covering WP_REST_Controller functionality
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_REST_Test_Controller extends WP_REST_Controller {

	/**
	 * Get the Post type's schema, conforming to JSON Schema
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'type',
			'type'                 => 'object',
			'properties'           => array(
				'somestring'       => array(
					'type'         => 'string',
					'description'  => 'A pretty string.',
					'context'      => array( 'view' ),
				),
				'someinteger'      => array(
					'type'         => 'integer',
					'context'      => array( 'view' ),
				),
				'someboolean'      => array(
					'type'         => 'boolean',
					'context'      => array( 'view' ),
				),
				'someurl'          => array(
					'type'         => 'string',
					'format'       => 'uri',
					'context'      => array( 'view' ),
				),
				'somedate'             => array(
					'type'         => 'string',
					'format'       => 'date-time',
					'context'      => array( 'view' ),
				),
				'someemail'             => array(
					'type'         => 'string',
					'format'       => 'email',
					'context'      => array( 'view' ),
				),
				'someenum'         => array(
					'type'         => 'string',
					'enum'         => array( 'a', 'b', 'c' ),
					'context'      => array( 'view' ),
				),
				'someargoptions'   => array(
					'type'         => 'integer',
					'required'     => true,
					'arg_options'  => array(
						'required'          => false,
						'sanitize_callback' => '__return_true',
					),
				),
				'somedefault'      => array(
					'type'         => 'string',
					'enum'         => array( 'a', 'b', 'c' ),
					'context'      => array( 'view' ),
					'default'      => 'a',
				),
			),
		);

		return $schema;
	}

}
