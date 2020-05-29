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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_save_nonce' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read menu items if they have access to edit them.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		$post_type = get_post_type_object( 'nav_menu_item' );
		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error( 'rest_forbidden_context', __( 'Sorry, you are not allowed to edit posts in this post type.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}
		return true;
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
