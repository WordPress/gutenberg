<?php
/**
 * Rest Fonts Library Controller.
 *
 * This file contains the class for the REST API Fonts Library Controller.
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 * @since      X.X.X
 */

if ( class_exists( 'WP_REST_Fonts_Library_Controller' ) ) {
	return;
}

/**
 * Fonts Library Controller class.
 */
class WP_REST_Fonts_Library_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->rest_base = 'fonts';
		$this->namespace = 'wp/v2';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'install_fonts' ),
					'permission_callback' => array( $this, 'update_fonts_library_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'uninstall_fonts' ),
					'permission_callback' => array( $this, 'update_fonts_library_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Removes font families from the fonts library and all their assets.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function uninstall_fonts( $request ) {
		$fonts_param = $request->get_param( 'fontFamilies' );

		foreach ( $fonts_param as $font_data ) {
			$font = new WP_Font_Family( $font_data );
			$result = $font->uninstall();

			// If there was an error uninstalling the font, return the error.
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		return new WP_REST_Response( __( 'Font family uninstalled successfully.', 'gutenberg' ), 200 );
	}

	/**
	 * Checks whether the user has permissions to update the fonts library.
	 *
	 * @return true|WP_Error True if the request has write access for the item, WP_Error object otherwise.
	 */
	public function update_fonts_library_permissions_check() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_update_fonts_library',
				__( 'Sorry, you are not allowed to update the fonts library on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		// The update endpoints requires write access to the temp and the fonts directories.
		$temp_dir   = get_temp_dir();
		$upload_dir = wp_upload_dir()['basedir'];
		if ( ! is_writable( $temp_dir ) || ! wp_is_writable( $upload_dir ) ) {
			return new WP_Error(
				'rest_cannot_write_fonts_folder',
				__( 'Error: WordPress does not have permission to write the fonts folder on your server.', 'gutenberg' ),
				array(
					'status' => 500,
				)
			);
		}

		return true;
	}

	/**
	 * Installs new fonts.
	 *
	 * Takes a request containing new fonts to install, downloads their assets, and adds them to the fonts library.
	 *
	 * @param WP_REST_Request $request The request object containing the new fonts to install in the request parameters.
	 * @return WP_REST_Response|WP_Error The updated fonts library post content.
	 */
	public function install_fonts( $request ) {
		// Get new fonts to install.
		$fonts_param = $request->get_param( 'fontFamilies' );

		/*
		 * As we are receiving form data, the font families are encoded as a string.
		 * We are using form data because local fonts need to use that format to attach the files in the request.
		 */
		$fonts_to_install = json_decode( $fonts_param, true );

		if ( empty( $fonts_to_install ) ) {
			return new WP_Error( 'no_fonts_to_install', __( 'No fonts to install', 'gutenberg' ), array( 'status' => 400 ) );
		}

		// Get uploaded files (used when installing local fonts).
		$files = $request->get_file_params();

		// Iterates the fonts data received and creates a new WP_Font_Family object for each one.
		$fonts_installed = array();
		foreach ( $fonts_to_install as $font_data ) {
			$font = new WP_Font_Family( $font_data );
			$font->install( $files );
			$fonts_installed[] = $font;
		}

		if ( empty( $fonts_installed ) ) {
			return new WP_Error( 'error_installing_fonts', __( 'Error installing fonts. No font was installed.', 'gutenberg' ), array( 'status' => 500 ) );
		}

		$response = array();
		foreach ( $fonts_installed as $font ) {
			$response[] = $font->get_data();
		}
		return new WP_REST_Response( $response );
	}

}
