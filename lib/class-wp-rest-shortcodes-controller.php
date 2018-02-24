<?php
/**
 * Shortcode Blocks REST API: WP_REST_Shortcodes_Controller class
 *
 * @package gutenberg
 * @since 2.0.0
 */

/**
 * Controller which provides a REST endpoint for Gutenberg to preview shortcode blocks.
 *
 * @since 2.0.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Shortcodes_Controller extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 *
	 * @since 2.0.0
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
	 * @since 2.0.0
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
	 * @since 2.0.0
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_shortcode_output( $request ) {
		global $post;
		global $wp_embed;
		$style     = '';
		$js        = '';
		$type      = 'html';
		$output    = '';
		$args      = $request->get_params();
		$post      = isset( $args['postId'] ) ? get_post( $args['postId'] ) : null;
		$shortcode = isset( $args['shortcode'] ) ? trim( $args['shortcode'] ) : '';

		// Initialize $data.
		$data = array(
			'html'  => $output,
			'type'  => $type,
			'style' => $style,
			'js'    => $js,
		);

		if ( empty( $shortcode ) ) {
			$data['html'] = __( 'Enter something to preview', 'gutenberg' );
			return rest_ensure_response( $data );
		}

		if ( ! empty( $post ) ) {
			setup_postdata( $post );
		}

		$output = apply_filters('the_content', $shortcode);

		if ( empty( $output ) ) {
			$data['html'] = __( 'Sorry, couldn\'t render a preview', 'gutenberg' );
			return rest_ensure_response( $data );
		}

		$type = 'html';

		ob_start();
		wp_head();
		$style = ob_get_clean();


		ob_start();
		wp_footer();
		$js = ob_get_clean();

		$data = array(
			'html'  => $output,
			'type'  => $type,
			'style' => $style,
			'js'    => $js,
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves a shortcode block's schema, conforming to JSON Schema.
	 *
	 * @since 0.10.0
	 * @access public
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/schema#',
			'title'      => 'shortcode-block',
			'type'       => 'object',
			'properties' => array(
				'html'  => array(
					'description' => __( 'The block\'s content with shortcodes filtered through hooks.', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
				'type'  => array(
					'description' => __( 'The filtered content type - video or otherwise', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
				'style' => array(
					'description' => __( 'Links to external style sheets needed to render the shortcode', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
				'js'    => array(
					'description' => __( 'Links to external javascript and inline scripts needed to render the shortcode', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
			),
		);
	}
}
