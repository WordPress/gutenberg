<?php
/**
 * Reusable Blocks REST API: WP_REST_Reusable_Blocks_Controller class
 *
 * @package gutenberg
 * @since 0.10.0
 */

/**
 * Controller which provides a REST endpoint for Gutenberg to preview shortcode blocks.
 *
 * @since 0.10.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Shortcodes_Controller extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 *
	 * @since 0.10.0
	 * @access public
	 */
	public function __construct() {
		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'shortcodes';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 0.10.0
	 * @access public
	 */
	public function register_routes() {
		// @codingStandardsIgnoreLine - PHPCS mistakes $this->namespace for the namespace keyword
		$namespace = $this->namespace;

		register_rest_route( $namespace, '/' . $this->rest_base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_shortcode_output' ),
				'permission_callback' => array( $this, 'get_shortcode_output_permissions_check' ),
			),
			'schema' => array( $this, 'get_public_item_schema' ),
		) );
	}

	/**
	 * Checks if a given request has access to read shortcode blocks.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_shortcode_output_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'gutenberg_shortcode_block_cannot_read', __( 'Sorry, you are not allowed to read shortcode blocks as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		return true;
	}

	/**
	 * Filters shortcode content through their hooks.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_shortcode_output( $request ) {
		$args = $request->get_params();
		global $post;
		global $wp_embed;
		$post = get_post( $args['postId'] );
		setup_postdata( $post );

		if ( has_shortcode( $args['shortcode'], 'embed' ) ) {
			$data = do_shortcode( $wp_embed->run_shortcode( $args['shortcode'] ));
		} else {
			$data = do_shortcode( $args['shortcode'] );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves a reusable block's schema, conforming to JSON Schema.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/schema#',
			'title'      => 'reusable-block',
			'type'       => 'object',
			'properties' => array(
				'shortcode' => array(
					'description' => __( 'The block\'s shortcode content.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
				),
			),
		);
	}
}
