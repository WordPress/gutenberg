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
					'args'                 => array(
						'fontFamilies' => array(
							'required' => true,
							'type'     => 'string',
							'validate_callback' => array( $this, 'validate_install_font_families' ),
						),
					),
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
					'args'                => $this->uninstall_schema(),
				),
			)
		);
	}

	/**
	 * Get all the errors (if any) for the font families to install data provided.
	 *
	 * @param array $font_families Array of font families to install.
	 * 
	 * @return array $error_messages Array of error messages.
	 */
	private function get_validation_errors ( $font_families ) {
		$error_messages = array();

		if ( ! is_array( $font_families ) ) {
			$error_messages[] = __( 'fontFamilies should be an array of font families.', 'gutenberg' );
			return $error_messages;
		}

		//check if there is at least one font family
		if ( count( $font_families ) < 1 ) {
			$error_messages[] = __( 'fontFamilies should have at least one font family definition.', 'gutenberg' );
			return $error_messages;
		}

		for ( $family_index = 0; $family_index < count( $font_families ); $family_index++ ) {
			$font_family = $font_families[ $family_index ];

			if ( ! isset( $font_family['slug'] ) || ! isset( $font_family['name'] ) || ! isset( $font_family['fontFamily'] ) ) {
				$error_messages[] = sprintf (
					__( 'Font family [%s] should have slug, name and fontFamily properties defined.', 'gutenberg' ), $family_index
				);
			}

			if ( isset( $font_family['fontFace'] ) ) {
				if ( !is_array( $font_family['fontFace'] ) ) {
					$error_messages[] = sprintf (
						__( 'Font family [%s] should have fontFace property defined as an array.', 'gutenberg' ), $family_index
					);
				}

				if ( count ( $font_family['fontFace'] ) < 1 ) {
					$error_messages[] = sprintf (
						__( 'Font family [%s] should have at least one font face definition.', 'gutenberg' ), $family_index
					);
				}

				if ( !empty ( $font_family['fontFace'] ) ) { 
					for ( $face_index = 0; $face_index < count( $font_family['fontFace'] ); $face_index++ ) {

						$font_face = $font_family['fontFace'][ $face_index ];
						if ( ! isset( $font_face['fontWeight'] ) || ! isset( $font_face['fontStyle'] )  ) {
							$error_messages[] = sprintf (
								__( 'Font family [%s] Font face [%s] should have fontWeight and fontStyle properties defined.', 'gutenberg' ), $family_index, $face_index
							);
						}


						if ( isset ( $font_face['download_from_url'] ) &&  isset ( $font_face['uplodaded_file'] ) ) {
							$error_messages[] = sprintf (
								__( 'Font family [%s] Font face [%s] should have only one of the download_from_url or uploaded_file properties defined and not both.', 'gutenberg' ), $family_index, $face_index
							);
						}

						if ( isset( $font_face['uploaded_file'] ) ) {
							$files = $request->get_file_params();
							if ( !isset( $files[ $font_face['uploaded_file'] ] ) ) {
								$error_messages[]= sprintf (
									__( 'Font family [%s] Font face [%s] file is not defined in the request files.', 'gutenberg' ), $family_index, $face_index
								);
							}
						}
					}
				}
			}
		}
		return $error_messages;
	}

	/**
	 * Validate input for the install endpoint.
	 * 
	 * @param string $param The font families to install.
	 * @param WP_REST_Request $request The request object.
	 * @param string $key The parameter key.
	 * 
	 * @return true|WP_Error True if the parameter is valid, WP_Error otherwise.
	 */
	public function validate_install_font_families ( $param, $request, $key ) {
		$font_families = json_decode( $param, true );
		$error_messages = $this->get_validation_errors( $font_families );

		if ( empty( $error_messages ) ) {
			return true;
		}

		return new WP_Error( 'rest_invalid_param', implode( ', ', $error_messages ), array( 'status' => 400 ) );
	}

	/**
	 * Schema for the uninstall endpoint.
	 * 
	 * @return array Schema array.
	 */
	public function uninstall_schema () {
		return array(
			'fontFamilies' => array(
				'type' => 'array',
				'description' => __( 'The font families to install.', 'gutenberg' ),
				'required' => true,
				'minItems' => 1,
				'items' => array(
					'required' => true,
					'type' => 'object',
					'properties' => array(
						'slug' => array(
							'type' => 'string',
							'description' => __( 'The font family slug.', 'gutenberg' ),
							'required' => true,
						),
					),
				),
			),
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
			$font   = new WP_Font_Family( $font_data );
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
