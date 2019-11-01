<?php
/**
 *
 *
 * @package gutenberg
 * @since 5.?.0
 */

/**
 * Controller which provides REST endpoint for retrieving information
 * from a remote site's HTML response.
 *
 * @since 5.?.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_URL_Details_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'url-details';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/title',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_title' ),
					'args' => array(
						'url' => array(
							'validate_callback' => 'wp_http_validate_url',
							'sanitize_callback' => 'esc_url_raw',
						),
					),
					'permission_callback' => array( $this, 'get_remote_url_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Retrieves the contents of the <title> tag from the HTML
	 * response.
	 *
	 * @access public
	 * @param WP_REST_REQUEST $request Full details about the request.
	 * @return String|WP_Error The title text or an error.
	 */
	public function get_title( $request ) {
		$url   = $request->get_param( 'url' );
		$title = $this->get_remote_url_title( $url );

		return rest_ensure_response( $title );
	}

	/**
	 * Checks whether a given request has permission to read remote urls.
	 *
	 * @return WP_Error|bool True if the request has access, WP_Error object otherwise.
	 */
	public function get_remote_url_permissions_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to access remote urls.', 'gutenberg' )
			);
		}

		return true;
	}

	/**
	 * Retrieves the document title from a remote URL.
	 *
	 * @param string $url The website url whose HTML we want to access.
	 * @return string|WP_Error The URL's document title on success, WP_Error on failure.
	 */
	private function get_remote_url_title( $url ) {
		// Transient per URL.
		$cache_key = 'g_url_details_response_' . hash( 'crc32b', $url );

		// Attempt to retrieve cached response.
		$title = get_transient( $cache_key );

		if ( empty( $title ) ) {
			$request                = wp_safe_remote_get( $url, array(
				'timeout'             => 10,
				'limit_response_size' => 153600, // 150 KB.
			) );
			$remote_source = wp_remote_retrieve_body( $request );

			if ( ! $remote_source ) {
				return new WP_Error( 'no_response', __( 'The source URL does not exist.', 'gutenberg' ), array( 'status' => 404 ) );
			}

			preg_match( '|<title>([^<]*?)</title>|is', $remote_source, $match_title );
			$title = isset( $match_title[1] ) ? trim( $match_title[1] ) : '';

			if ( empty( $title ) ) {
				return new WP_Error( 'no_title', __( 'No document title at remote url.', 'gutenberg' ), array( 'status' => 404 ) );
			}

			// Only cache valid responses.
			set_transient( $cache_key, $title, HOUR_IN_SECONDS );
		}

		return $title;
	}
}
