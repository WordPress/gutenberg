<?php
/**
 * REST API: Gutenberg_REST_Navigation_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

require __DIR__ . '/class-wp-navigation-gutenberg.php';


/**
 * Base Templates REST API Controller.
 */
class WP_REST_Navigation_Controller extends WP_REST_Posts_Controller {

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {

		parent::register_routes();

		// Lists a single nav item based on the given id or slug.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/fallbacks',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fallbacks' ),
					'permission_callback' => array( $this, 'get_fallbacks_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::READABLE ),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_fallbacks_permissions_check( $request ) {
		return true;
	}

	public function get_fallbacks() {
		// Todo - see if we can inject this dependency.
		return WP_Navigation_Gutenberg::get_fallback_menu();
	}
}
