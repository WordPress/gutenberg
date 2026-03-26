<?php

class Gutenberg_REST_Icons_Controller_7_1 extends WP_REST_Icons_Controller {
	/**
	 * Modified to point to the new `get_item` and `get_items`
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			true // Override the core route.
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<name>[a-z][a-z0-9-]*/[a-z][a-z0-9-]*)',
			array(
				'args'   => array(
					'name' => array(
						'description' => __( 'Icon name.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			true // Override the core route.
		);
	}

	/**
	 * Modified to call Gutenberg_Icons_Registry_7_1
	 */
	public function get_items( $request ) {
		$response = array();
		$search   = $request->get_param( 'search' );
		$icons    = Gutenberg_Icons_Registry_7_1::get_instance()->get_registered_icons( $search );
		foreach ( $icons as $icon ) {
			$prepared_icon = $this->prepare_item_for_response( $icon, $request );
			$response[]    = $this->prepare_response_for_collection( $prepared_icon );
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Modified to call Gutenberg_Icons_Registry_7_1
	 */
	public function get_icon( $name ) {
		$registry = Gutenberg_Icons_Registry_7_1::get_instance();
		$icon     = $registry->get_registered_icon( $name );

		if ( null === $icon ) {
			return new WP_Error(
				'rest_icon_not_found',
				sprintf(
					// translators: %s is the name of any user-provided name
					__( 'Icon not found: "%s".', 'gutenberg' ),
					$name
				),
				array( 'status' => 404 )
			);
		}

		return $icon;
	}
}
