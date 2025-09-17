<?php

class Gutenberg_REST_Templates_Controller extends WP_REST_Posts_Controller {
	protected function handle_status_param( $status, $request ) {
		if ( 'auto-draft' === $status ) {
			return $status;
		}
		return parent::handle_status_param( $status, $request );
	}
	protected function add_additional_fields_schema( $schema ) {
		$schema = parent::add_additional_fields_schema( $schema );

		$schema['properties']['status']['enum'][] = 'auto-draft';
		return $schema;
	}
}
