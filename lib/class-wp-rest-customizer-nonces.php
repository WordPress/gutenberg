<?php
/**
 * WP_Rest_Customizer_Nonces class.
 *
 * @package gutenberg
 */

/**
 * Class that returns the customizer "save" nonce that's required for the
 * batch save operation using the customizer API endpoint.
 */
class WP_Rest_Customizer_Nonces extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'customizer-nonces';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/get-save-nonce',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_save_nonce' ),
					'args'     => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Returns the nonce required to request the customizer API endpoint.
	 *
	 * @access public
	 */
	public function get_save_nonce() {
		require_once ABSPATH . 'wp-includes/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager();
		$nonce        = wp_create_nonce( 'save-customize_' . $wp_customize->get_stylesheet() );
		return array(
			'success'    => true,
			'nonce'      => $nonce,
			'stylesheet' => $wp_customize->get_stylesheet(),
		);
	}

}
