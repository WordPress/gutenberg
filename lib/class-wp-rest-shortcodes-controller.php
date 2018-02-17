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
		$cache_key = 'shortcode_' . md5( serialize( $args ) );
		$data      = get_transient( $cache_key );
		if ( ! empty( $data ) ) {
			return rest_ensure_response( $data );
		}

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

		// Since the [embed] shortcode needs to be run earlier than other shortcodes,
		// do_shortcode() will not work with [embed] if there are other shortcodes registered.
		if ( has_shortcode( $shortcode, 'embed' ) ) {
			$embed_request = new WP_REST_Request( 'GET', '/oembed/1.0/proxy' );
			$pattern       = get_shortcode_regex();
			if ( preg_match_all( '/' . $pattern . '/s', $shortcode, $matches ) ) {
				$embed_request['url'] = $matches[5][0];
				$embed_response       = rest_do_request( $embed_request );
				if ( $embed_response->is_error() ) {
					// Convert to a WP_Error object.
					$error      = $embed_response->as_error();
					$message    = $embed_response->get_error_message();
					$error_data = $embed_response->get_error_data();
					$status     = isset( $error_data['status'] ) ? $error_data['status'] : 500;
					wp_die( printf( '<p>An error occurred: %s (%d)</p>', $message, $error_data ) );
				}
				$embed_data = $embed_response->get_data();
				$output     = $embed_data->html;
			}
		} else {
			$output = do_shortcode( $shortcode );
		}

		if ( empty( $output ) ) {
			$data['html'] = __( 'Sorry, couldn\'t render a preview', 'gutenberg' );
			return rest_ensure_response( $data );
		}

		// Check if shortcode is returning a video. The video type will be used by the frontend to maintain 16:9 aspect ratio.
		if ( has_shortcode( $shortcode, 'video' ) ) {
			$type = 'video';
		} elseif ( has_shortcode( $shortcode, 'embed' ) ) {
			$type = $embed_data->type;
		} else {
			$type = 'html';
			// Gallery and caption shortcodes need the theme style to be embedded in the shortcode preview iframe.
			if ( has_shortcode( $shortcode, 'gallery' ) || has_shortcode( $shortcode, 'caption' ) || has_shortcode( $shortcode, 'wp_caption' ) ) {
				$style = '<link rel="stylesheet" type="text/css" href="' . get_stylesheet_uri() . '" />';
			}

			// Playlist shortcodes need the playlist JS to be embedded in the shortcode preview iframe.
			if ( has_shortcode( $shortcode, 'playlist' ) ) {
				ob_start();
				wp_footer();
				$js = ob_get_clean();
			}
		}

		$data = array(
			'html'  => $output,
			'type'  => $type,
			'style' => $style,
			'js'    => $js,
		);

		// Caches the result for 12 hours.
		set_transient( $cache_key, $data, 12 * HOUR_IN_SECONDS );

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
