<?php
/**
 * REST API: Gutenberg_REST_Block_Form_Submit_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 * @since      6.3.0
 */

/**
 * Core class used to submit forms (using the form block) via the REST API.
 *
 * @see   WP_REST_Controller
 */
class Gutenberg_REST_Block_Form_Submit_Controller extends WP_REST_Controller {

	/**
	 * The namespace of this controller's route.
	 *
	 * @var string
	 */
	protected $namespace = 'wp/v2';

	/**
	 * The base of this controller's route.
	 *
	 * @var string
	 */
	protected $rest_base = 'block-form-submit';

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see   register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'form_submit' ),
					'permission_callback' => array( $this, 'form_submit_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read block patterns.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function form_submit_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return rest_cookie_check_errors( null );
	}

	/**
	 * Process the form submission.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function form_submit( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$params = $request->get_params();

		/**
		 * Allow short-circuiting the form submission.
		 *
		 * @param array $params The form parameters.
		 *
		 * @return bool True if the form submission should be short-circuited, false otherwise.
		 */
		if ( apply_filters( 'gutenberg_form_submit_short_circuit', false, $params ) ) {
			return;
		}

		$content = sprintf(
			/* translators: %s: The request URI. */
			__( 'Form submission from %1$s', 'gutenberg' ) . '</br>',
			'<a href="' . esc_url( $params['_wp_http_referer'] ) . '">' . esc_url( $params['_wp_http_referer'] ) . '</a>'
		);

		$skip_fields = array( 'wp_rest', '_wp_http_referer', 'rest_route' );
		foreach ( $params as $key => $value ) {
			if ( in_array( $key, $skip_fields, true ) ) {
				continue;
			}
			$content .= $key . ': ' . $value . '</br>';
		}

		wp_mail( get_option( 'admin_email' ), __( 'Form submission', 'gutenberg' ), $content );

		wp_safe_redirect( get_site_url( null, $params['_wp_http_referer'] ) );
		exit;
	}
}
