<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Global Styles REST API Controller.
 */
class Gutenberg_REST_Global_Styles_Controller extends WP_REST_Global_Styles_Controller {
	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		// List themes global styles.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/themes/(?P<stylesheet>[\/\s%\w\.\(\)\[\]\@_\-]+)/variations',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_theme_items' ),
					'permission_callback' => array( $this, 'get_theme_items_permissions_check' ),
					'args'                => array(
						'stylesheet' => array(
							'description' => __( 'The theme identifier', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
			)
		);

		parent::register_routes();
	}

	/**
	 * Checks if a given request has access to read a single theme global styles config.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_theme_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Verify if the current user has edit_theme_options capability.
		// This capability is required to edit/view/delete templates.
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_manage_global_styles',
				__( 'Sorry, you are not allowed to access the global styles on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Returns the given theme global styles variations.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_theme_items( $request ) {
		if ( wp_get_theme()->get_stylesheet() !== $request['stylesheet'] ) {
			// This endpoint only supports the active theme for now.
			return new WP_Error(
				'rest_theme_not_found',
				__( 'Theme not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$variations     = array();
		$base_directory = get_stylesheet_directory() . '/styles';
		if ( is_dir( $base_directory ) ) {
			$nested_files      = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base_directory ) );
			$nested_html_files = new RegexIterator( $nested_files, '/^.+\.json$/i', RecursiveRegexIterator::GET_MATCH );
			foreach ( $nested_html_files as $path => $file ) {
				$decoded_file = wp_json_file_decode( $path, array( 'associative' => true ) );
				if ( is_array( $decoded_file ) ) {
					$variations[] = ( new WP_Theme_JSON_Gutenberg( $decoded_file ) )->get_raw_data();
				}
			}
		}
		$response = rest_ensure_response( $variations );

		return $response;
	}
}
