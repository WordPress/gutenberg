<?php
/**
 * REST API: WP_REST_URL_Details_Controller class
 *
 * @package Gutenberg
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
					'schema'              => array( $this, 'get_public_item_schema' ),
				),
			)
		);
	}

	/**
	 * Get the schema for the endpoint.
	 *
	 * @return array the schema.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'url-details',
			'type'       => 'object',
			'properties' => array(
				'title' => array(
					'description' => __( 'The contents of the <title> tag from the URL.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
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
		$cache_key = $this->build_cache_key_for_url( $url );

		// Attempt to retrieve cached response.
		$data = $this->get_cache( $cache_key );

		if ( ! empty( $data ) ) {
			return json_decode( $data, true );
		}

		$response_body = $this->get_remote_url( $url );

		// Exit if we don't have a valid body or it's empty.
		if ( is_wp_error( $response_body ) || empty( $response_body ) ) {
			return $response_body;
		}

		/**
		 * Filters the data returned for a given URL.
		 *
		 * Can be used to modify the data retrieved for a given URL.
		 * For example, you may wish to retrieve additional information
		 * from the response body at a given URL over and above the `<title>`.
		 *
		 * @param array $data The default data retrieved for the given URL.
		 * @param array $response_body The response body (HTML) for the given URL.
		 * @param string $url The attempted URL.
		 */
		$data = apply_filters(
			'rest_url_details_url_data',
			array(
				'title' => $this->get_title( $response_body ),
			),
			$response_body,
			$url
		);

		// Cache the valid response.
		$this->set_cache( $cache_key, $data );

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

		$args = array(
			'limit_response_size' => 150 * KB_IN_BYTES,
		);

		/**
		 * Filters the HTTP request args for URL data retrieval.
		 *
		 * Can be used to adjust response size limit and other WP_Http::request args.
		 *
		 * @param array $args Arguments used for the HTTP request
		 * @param string $url The attempted URL.
		 */
		$args = apply_filters( 'rest_url_details_http_request_args', $args, $url );

		$response = wp_safe_remote_get(
			$url,
			$args
		);

		if ( WP_Http::OK !== wp_remote_retrieve_response_code( $response ) ) {
			// Not saving the error response to cache since the error might be temporary.
			return new WP_Error( 'no_response', get_status_header_desc( 404 ), array( 'status' => WP_Http::NOT_FOUND ) );
		}

		$remote_body = wp_remote_retrieve_body( $response );

		if ( empty( $remote_body ) ) {
			return new WP_Error( 'no_content', __( 'Unable to retrieve body from response at this URL.', 'gutenberg' ), array( 'status' => WP_Http::NOT_FOUND ) );
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

	/**
	 * Utility function to build cache key for a given URL.
	 *
	 * @param string $url the URL for which to build a cache key.
	 * @return string the cache key.
	 */
	private function build_cache_key_for_url( $url ) {
		return 'g_url_details_response_' . md5( $url );
	}

	/**
	 * Utility function to retrieve a value from the cache at a given key.
	 *
	 * @param string $key the cache key.
	 * @return string the value from the cache.
	 */
	private function get_cache( $key ) {
		return get_transient( $key );
	}

	/**
	 * Utility function to cache a given data set at a given cache key.
	 *
	 * @param string $key the cache key under which to store the value.
	 * @param array  $data the data to be stored at the given cache key.
	 * @return void
	 */
	private function set_cache( $key, $data = array() ) {
		if ( ! is_array( $data ) ) {
			return;
		}

		/**
		 * Filters the cache expiration.
		 *
		 * Can be used to adjust the time until expiration in seconds for the cache
		 * of the data retrieved for the given URL.
		 *
		 * @param int HOUR_IN_SECONDS the time until cache expiration in seconds.
		 */
		$cache_expiration = apply_filters( 'rest_url_details_cache_expiration', HOUR_IN_SECONDS );

		return set_transient( $key, wp_json_encode( $data ), $cache_expiration );
	}
}
