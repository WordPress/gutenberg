<?php
/**
 *
 *
 * @package gutenberg
 * @since 5.?.0
 */

/**
 * Controller which provides REST endpoint for the widget areas.
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





	public function get_title( $request ) {

		// TODO: Sanitize and validate
		$url = $request->get_param( 'url' );

		$html_response = $this->get_remote_url_html( $url );

		if ( is_wp_error( $html_response ) ) {
			return new WP_Error( 'no_title', 'Unable to retrieve title tag. ' . $html_response->get_error_message(), array( 'status' => 404 ) );
		}

		$title_list = $html_response->getElementsByTagName( 'title' );

		$title = $title_list->item( 0 );

		if ( empty( $title ) ) {
			return new WP_Error( 'no_title', 'No title tag at remote url.', array( 'status' => 404 ) );
		}

		$title_text = $title->nodeValue;

		return rest_ensure_response( $title_text );
	}

	public function validate_url( $url ) {
		return wp_http_validate_url( $url );
	}

	public function sanitize_url( $url ) {
		return esc_url_raw( $url );
	}

	/**
	 * Checks whether a given request has permission to read remote urls.
	 *
	 * @since 5.7.0
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


	private function get_remote_url_html( $url ) {

		$response = wp_remote_get( $url );

		if ( is_wp_error( $response ) || ! is_array( $response ) ) {
			return new WP_Error( 'no_response', 'Unable to contact remote url . ' . $response->get_error_message(), array( 'status' => 404 ) );
		}

		$body = wp_remote_retrieve_body( $response );

		$dom = new DOMDocument( '1.0', 'UTF - 8' );

		// set error level
		$internalErrors = libxml_use_internal_errors( true );

		// load HTML
		$dom->loadHTML( $body );

		// Restore error level
		libxml_use_internal_errors( $internalErrors );

		return $dom;
	}
}
