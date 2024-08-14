<?php
/**
 * REST API: WP_REST_Block_Editor_Assets_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 */

if ( ! class_exists( 'WP_REST_Block_Editor_Assets_Controller' ) ) {

	/**
	 * Core class used to retrieve the block editor assets via the REST API.
	 *
	 * @see WP_REST_Controller
	 */
	class WP_REST_Block_Editor_Assets_Controller extends WP_REST_Controller {
		/**
		 * Constructor.
		 */
		public function __construct() {
			$this->namespace = 'wp-block-editor/v1';
			$this->rest_base = 'editor-assets';
		}

		/**
		 * Registers the controller routes.
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
					),
					'schema' => array( $this, 'get_public_item_schema' ),
				)
			);
		}

		public function get_items($request) {
			return array();
		}

		public function get_items_permissions_check($request) {
			return true;
		}
	}
}
