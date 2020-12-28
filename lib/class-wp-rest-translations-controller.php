<?php
/**
 * REST API: WP_REST_Translations_Controller class
 *
 * @package Gutenberg
 */

/**
 * Core class representing a controller for translations.
 */
class WP_REST_Translations_Controller extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'translations';
	}

	/**
	 * Registers the widget routes for the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'locale' => array(
							'description' => __( 'Locale', 'gutenberg' ),
							'type'        => 'string',
						),
						'handles' => array(
							'description' => __( 'Script Handles', 'gutenberg' ),
							'type'        => 'array',
							'required'    => true,
							'items'       => array(
								'type' => 'string',
							),
						),
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_item_permissions_check( $request ) {
		return true;
	}

	public function get_item( $request ) {
		$switched = $request['locale'] && switch_to_locale( $request['locale'] );

		$result = array();

		foreach( $request['handles'] as $handle ) {
			if ( ! isset( wp_scripts()->registered[ $handle ] ) ) {
				continue;
			}

			/* @var \_WP_Dependency $script */
			$script = wp_scripts()->registered[ $handle ];

			if( ! $script ) {
				continue;
			}

			$translations = load_script_textdomain( $handle, $script->textdomain, $script->translations_path );
			if ( $translations ) {
				$result[ $handle ] = json_decode( $translations );
			}
		}

		if( $switched ) {
			restore_previous_locale();
		}

		return $result;
	}
}
