<?php

/**
 * Overrides for the existing themes endpoint in Core
 */
class WP_REST_Themes_Controller_Overrides extends WP_REST_Themes_Controller {
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
				'schema' => array( $this, 'get_item_schema' ),
			),
			true
		);
	}

	public function get_item_schema() {
		$schema = parent::get_item_schema();
		$existing_properties = $schema['properties']['theme_supports']['properties'];
		$overrides = array(
			'__experimental-editor-gradient-presets' => array(
				'description' => __( 'Whether the theme supports a custom color scheme.' ),
				'type'        => array( 'array', 'bool' ),
				'items'       => [
					'type'       => 'object',
					'properties' => array(
						'name'  => 'string',
						'gradient'  => 'string',
						'color' => 'string,'
					),
					'required'   => [ 'name', 'gradient', 'color' ],
				],
				'readonly'    => true,
			),
		);
		$schema['properties']['theme_supports']['properties'] = array_merge( $existing_properties, $overrides );
		return $schema;
	}

	public function prepare_item_for_response( $theme, $request ) {
		$response = parent::prepare_item_for_response( $theme, $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$gradient_presets = get_theme_support( '__experimental-editor-gradient-presets' );
		$response->data['theme_supports']['__experimental-editor-gradient-presets'] = $gradient_presets;

		return $response;
	}
}
