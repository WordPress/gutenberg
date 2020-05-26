<?php
/**
 * Customizer Widget Blocks Section: WP_Customize_Widget_Blocks_Control class.
 *
 * @package gutenberg
 * @since 6.1.0
 */

/**
 * Class that renders the Customizer control for editing widgets with Gutenberg.
 *
 * @since 6.1.0
 */
class WP_Rest_Customizer_Nonces extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'customizer-nonces';
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/get-save-nonce',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_save_nonce' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_save_nonce(  ) {
		require_once ABSPATH . 'wp-includes/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager();
		$nonce        = wp_create_nonce( 'save-customize_' . $wp_customize->get_stylesheet() );
		return [
			"success" => true,
			"nonce" => $nonce,
		];
	}

}
