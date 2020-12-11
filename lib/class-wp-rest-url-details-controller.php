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
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'parse_url_details' ),
					'args'                => array(
						'url' => array(
							'required'          => true,
							'description'       => __( 'The URL to process.', 'gutenberg' ),
							'validate_callback' => 'wp_http_validate_url',
							'sanitize_callback' => 'esc_url_raw',
							'type'              => 'string',
							'format'            => 'uri',
						),
					),
					'permission_callback' => array( $this, 'permissions_check' ),
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
	public function parse_url_details( $request ) {

		$url = untrailingslashit( $request->get_param( 'url' ) );

		if ( empty( $url ) ) {
			return new WP_Error( 'rest_invalid_url', __( 'Invalid URL', 'gutenberg' ), array( 'status' => 404 ) );
		}

		// Transient per URL.
		$cache_key = 'g_url_details_response_' . md5( $url );

		// Attempt to retrieve cached response.
		$data = get_transient( $cache_key );

		// Return cache if valid data.
		if ( ! is_wp_error( $data ) && ! empty( $data ) ) {
			return json_decode( $data, true );
		}

		$response_body = $this->get_remote_url( $url );

		// Exit if we don't have a valid body or it's empty.
		if ( is_wp_error( $response_body ) || empty( $response_body ) ) {
			return $response_body;
		}

		$data = array(
			'title' => $this->get_title( $response_body ),
		);

		// Only cache valid responses.
		set_transient( $cache_key, wp_json_encode( $data ), HOUR_IN_SECONDS );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks whether a given request has permission to read remote urls.
	 *
	 * @return WP_Error|bool True if the request has access, WP_Error object otherwise.
	 */
	public function permissions_check() {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_user_cannot_view',
			__( 'Sorry, you are not allowed to process remote urls.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieves the document title from a remote URL.
	 *
	 * @param string $url The website url whose HTML we want to access.
	 * @return string|WP_Error The URL's document title on success, WP_Error on failure.
	 */
	private function get_remote_url( $url ) {

		$response = wp_safe_remote_get(
			$url,
			array(
				'timeout'             => 10,
				'limit_response_size' => 153600, // 150 KB.
			)
		);

		if ( WP_Http::OK !== wp_remote_retrieve_response_code( $response ) ) {
			// Not saving the error response to cache since the error might be temporary.
			return new WP_Error( 'rest_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		$remote_body = wp_remote_retrieve_body( $response );

		if ( ! $remote_body ) {
			return new WP_Error( 'no_response', __( 'Unable to retrieve body from response at this URL.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		return $remote_body;
	}

	/**
	 * Parses the <title> contents from the provided HTML
	 *
	 * @param string $html the HTML from the remote website at URL.
	 * @return string the title tag contents (maybe empty).
	 */
	private function get_title( $html ) {
		preg_match( '|<title>([^<]*?)</title>|is', $html, $match_title );

		$title = isset( $match_title[1] ) ? trim( $match_title[1] ) : '';

		return $title;
	}
}
