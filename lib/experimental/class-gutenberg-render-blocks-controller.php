<?php
/**
 * File description goes here.
 *
 * @package Gutenberg_Render_Blocks_Controller
 */

if ( ! class_exists( 'Gutenberg_Render_Blocks_Controller' ) ) {

	/**
	 * Class Gutenberg_Render_Blocks_Controller
	 *
	 * Renders blocks from a REST API request.
	 *
	 * @package Gutenberg_Render_Blocks_Controller
	 */
	class Gutenberg_Render_Blocks_Controller extends WP_REST_Controller {

		/**
		 * Constructor.
		 */
		public function __construct() {
			$this->namespace = 'wp/v2';
			$this->rest_base = 'render_blocks';
		}

			/**
			 * Registers the routes for the objects of the controller.
			 */
		public function register_routes() {
			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base,
				array(
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => array( $this, 'render_blocks_from_request' ),
						'permission_callback' => array( $this, 'get_permissions_check' ),
						'args'                => array(
							'blocks' => array(
								'required'          => true,
								'validate_callback' => array( $this, 'validate_blocks' ),
								'sanitize_callback' => array( $this, 'sanitize_blocks' ),
							),
						),
						'schema'              => array( $this, 'get_item_schema' ),
					),
				)
			);
		}

		/**
		 * Checks if a given request has access to create items.
		 */
		public function get_permissions_check() {
				return true;
		}

		/**
		 * Checks if the blocks string is valid.
		 *
		 * @param string $blocks Full data about the request.
		 * @return WP_Error|bool True if the request has read access for the item, WP_Error object otherwise.
		 */
		public function validate_blocks( $blocks ) {
			$blocks = parse_blocks( $blocks );
			if ( ! is_array( $blocks ) ) {
				// If parse_blocks does not return an array, it's not a valid block string.
				return new WP_Error( 'rest_invalid_blocks', __( 'The blocks parameter is invalid.', 'gutenberg' ), array( 'status' => 400 ) );
			}

			return true;
		}

		/**
		 * Sanitizes the 'blocks' parameter.
		 *
		 * @param string $blocks The blocks string.
		 */
		public function sanitize_blocks( $blocks ) {
				// Sanitize the blocks string to ensure it's a clean string.
				return wp_kses_post( $blocks );
		}

		/**
		 * Renders blocks from a REST API request.
		 *
		 * @param WP_REST_Request $request Full data about the request.
		 */
		public function render_blocks_from_request( $request ) {
			global $wp_query, $post;

			$data = $request->get_json_params();

			// We need to fake a global $wp_query and $post.
			// This is because some blocks (e.g. Query block) rely on them,
			// and we don't have them in the REST API context.
			// Without them, the preview will be empty.
			$fake_query = new WP_Query(
				array(
					'post_type'      => 'post',
					'posts_per_page' => get_option( 'posts_per_page' ),
					'post_status'    => 'publish',
				)
			);
			$wp_query   = $fake_query;
			$post       = $wp_query->posts[0];

			$rendered_blocks = do_blocks( $data['blocks'] );

			return rest_ensure_response( $rendered_blocks );
		}

		/**
		 * Retrieves the block renderer's schema, conforming to JSON Schema.
		 */
		public function get_item_schema() {
			return array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'block-render',
				'type'       => 'object',
				'properties' => array(
					'blocks' => array(
						'description' => __( 'Serialized blocks to render', 'gutenberg' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
					),
				),
			);
		}
	}
}
