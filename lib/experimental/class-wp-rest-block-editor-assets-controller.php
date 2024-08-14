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

		/**
		 * Checks the permissions for retrieving items.
		 *
		 * @param WP_REST_Request $request The REST request object.
		 *
		 * @return bool|WP_Error True if the request has permission, WP_Error object otherwise.
		 */
		public function get_items_permissions_check($request) {
			if ( current_user_can( 'edit_posts' ) ) {
				return true;
			}

			foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
				if ( current_user_can( $post_type->cap->edit_posts ) ) {
					return true;
				}
			}

			return new WP_Error(
				'rest_cannot_read_block_editor_assets',
				__( 'Sorry, you are not allowed to read the block editor assets.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
	}
}
