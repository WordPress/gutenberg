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
							'validate_callback' => function( $param ) {
								return $this->validate_url( $param );
							},
							'sanitize_callback' => function( $param ) {
								return $this->sanitize_url( $param );
							},
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
	 * @param  WP_REST_REQUEST $request Full details about the request.
	 * @return String|WP_Error          the title text or an error.
	 */
	public function get_title( $request ) {

		$url = $request->get_param( 'url' );

		$html_response = $this->get_remote_url_html( $url );

		if ( is_wp_error( $html_response ) ) {
			return new WP_Error( 'no_title', __( 'Unable to retrieve title tag.', 'gutenberg' ) . $html_response->get_error_message(), array( 'status' => 404 ) );
		}

		$title_list = $html_response->getElementsByTagName( 'title' );

		$title = $title_list->item( 0 );

		if ( empty( $title ) ) {
			return new WP_Error( 'no_title', __( 'No title tag at remote url.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$title_text = $title->nodeValue;

		return rest_ensure_response( $title_text );
	}

	/**
	 * Validates a given URL
	 *
	 * @param  String $url the url to validate
	 * @return Boolean      whether or not the URL is considered valid.
	 */
	public function validate_url( $url ) {
		return wp_http_validate_url( $url );
	}

	/**
	 * Sanitizes a given URL.
	 *
	 * @param  String $url the URL to sanitize.
	 * @return String      the sanitized version of the URL.
	 */
	public function sanitize_url( $url ) {
		return esc_url_raw( $url );
	}

	/**
	 * Checks whether a given request has permission to read remote urls.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has access, WP_Error object otherwise.
	 *
	 * This function is overloading a function defined in WP_REST_Controller so it should have the same parameters.
	 * phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	 */
	public function get_remote_url_permissions_check( $request ) {

		$required_cap = 'edit_posts';

		if ( ! current_user_can( $required_cap ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to access remote urls.', 'gutenberg' )
			);
		}

		return true;
	}
	/* phpcs:enable */


	/**
	 * Retrives a DOMDocument representation of the
	 * HTML from a remote URL
	 *
	 * @param  String $url the website url whose HTML we want to access.
	 * @return DOMDocument      the loaded HTML response.
	 */
	private function get_remote_url_html( $url ) {

		$response = null;

		// Transient per URL
		$cache_key = 'g_url_details_response_' . md5( $url );

		// Attempt to retrieve cached response
		$cached_response = get_transient( $cache_key );

		if ( ! empty( $cached_response ) ) {
			$response = $cached_response;
		} else {
			$response = wp_remote_get( $url );

			if ( is_wp_error( $response ) || ! is_array( $response ) ) {
				return new WP_Error( 'no_response', __( 'Unable to contact remote url.', 'gutenberg' ) . $response->get_error_message(), array( 'status' => 404 ) );
			}

			// Only cache valid responses.
			set_transient( $cache_key, $response, HOUR_IN_SECONDS );
		}

		$body = wp_remote_retrieve_body( $response );

		$dom = new DOMDocument( '1.0', 'UTF-8' );

		// set error level
		$internalErrors = libxml_use_internal_errors( true );

		// load HTML
		$dom->loadHTML( $body );

		// Restore error level
		libxml_use_internal_errors( $internalErrors );

		return $dom;
	}
}
