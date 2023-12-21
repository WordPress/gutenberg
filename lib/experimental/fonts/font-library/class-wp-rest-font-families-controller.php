<?php
/**
 * Rest Font Families Controller.
 *
 * This file contains the class for the REST API Font Families Controller.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( class_exists( 'WP_REST_Font_Families_Controller' ) ) {
	return;
}

/**
 * Font Families Controller class.
 *
 * @since 6.5.0
 */
class WP_REST_Font_Families_Controller extends WP_REST_Posts_Controller {

	/**
	 * Constructor.
	 *
	 * @since 6.5.0
	 */
	public function __construct() {
		$this->rest_base = 'font-families';
		$this->namespace = 'wp/v2';
		$this->post_type = 'wp_font_family';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 6.5.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => function () {
						return true;},
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'install_fonts' ),
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
					'args'                => array(
						'font_families' => array(
							'required'          => true,
							'type'              => 'string',
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
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
					'args'                => $this->uninstall_schema(),
				),
			)
		);
	}

	/**
	 * Returns validation errors in font families data for installation.
	 *
	 * @since 6.5.0
	 *
	 * @param array[] $font_families Font families to install.
	 * @param array   $files         Files to install.
	 * @return array $error_messages Array of error messages.
	 */
	private function get_validation_errors( $font_families, $files ) {
		$error_messages = array();

		if ( ! is_array( $font_families ) ) {
			$error_messages[] = __( 'font_families should be an array of font families.', 'gutenberg' );
			return $error_messages;
		}

		// Checks if there is at least one font family.
		if ( count( $font_families ) < 1 ) {
			$error_messages[] = __( 'font_families should have at least one font family definition.', 'gutenberg' );
			return $error_messages;
		}

		for ( $family_index = 0; $family_index < count( $font_families ); $family_index++ ) {
			$font_family = $font_families[ $family_index ];

			if (
				! isset( $font_family['slug'] ) ||
				! isset( $font_family['name'] ) ||
				! isset( $font_family['fontFamily'] )
			) {
				$error_messages[] = sprintf(
					// translators: 1: font family index.
					__( 'Font family [%s] should have slug, name and fontFamily properties defined.', 'gutenberg' ),
					$family_index
				);
			}

			if ( isset( $font_family['fontFace'] ) ) {
				if ( ! is_array( $font_family['fontFace'] ) ) {
					$error_messages[] = sprintf(
						// translators: 1: font family index.
						__( 'Font family [%s] should have fontFace property defined as an array.', 'gutenberg' ),
						$family_index
					);
					continue;
				}

				if ( count( $font_family['fontFace'] ) < 1 ) {
					$error_messages[] = sprintf(
						// translators: 1: font family index.
						__( 'Font family [%s] should have at least one font face definition.', 'gutenberg' ),
						$family_index
					);
				}

				if ( ! empty( $font_family['fontFace'] ) ) {
					for ( $face_index = 0; $face_index < count( $font_family['fontFace'] ); $face_index++ ) {

						$font_face = $font_family['fontFace'][ $face_index ];
						if ( ! isset( $font_face['fontWeight'] ) || ! isset( $font_face['fontStyle'] ) ) {
							$error_messages[] = sprintf(
								// translators: 1: font family index, 2: font face index.
								__( 'Font family [%1$s] Font face [%2$s] should have fontWeight and fontStyle properties defined.', 'gutenberg' ),
								$family_index,
								$face_index
							);
						}

						if ( isset( $font_face['downloadFromUrl'] ) && isset( $font_face['uploadedFile'] ) ) {
							$error_messages[] = sprintf(
								// translators: 1: font family index, 2: font face index.
								__( 'Font family [%1$s] Font face [%2$s] should have only one of the downloadFromUrl or uploadedFile properties defined and not both.', 'gutenberg' ),
								$family_index,
								$face_index
							);
						}

						if ( isset( $font_face['uploadedFile'] ) ) {
							if ( ! isset( $files[ $font_face['uploadedFile'] ] ) ) {
								$error_messages[] = sprintf(
									// translators: 1: font family index, 2: font face index.
									__( 'Font family [%1$s] Font face [%2$s] file is not defined in the request files.', 'gutenberg' ),
									$family_index,
									$face_index
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
	 * @since 6.5.0
	 *
	 * @param string          $param The font families to install.
	 * @param WP_REST_Request $request The request object.
	 * @return true|WP_Error True if the parameter is valid, WP_Error otherwise.
	 */
	public function validate_install_font_families( $param, $request ) {
		$font_families  = json_decode( $param, true );
		$files          = $request->get_file_params();
		$error_messages = $this->get_validation_errors( $font_families, $files );

		if ( empty( $error_messages ) ) {
			return true;
		}

		return new WP_Error( 'rest_invalid_param', implode( ', ', $error_messages ), array( 'status' => 400 ) );
	}

	/**
	 * Gets the schema for the uninstall endpoint.
	 *
	 * @since 6.5.0
	 *
	 * @return array Schema array.
	 */
	public function uninstall_schema() {
		return array(
			'font_families' => array(
				'type'        => 'array',
				'description' => __( 'The font families to install.', 'gutenberg' ),
				'required'    => true,
				'minItems'    => 1,
				'items'       => array(
					'required'   => true,
					'type'       => 'object',
					'properties' => array(
						'slug' => array(
							'type'        => 'string',
							'description' => __( 'The font family slug.', 'gutenberg' ),
							'required'    => true,
						),
					),
				),
			),
		);
	}

	/**
	 * Removes font families from the Font Library and all their assets.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function uninstall_fonts( $request ) {
		$fonts_to_uninstall = $request->get_param( 'font_families' );

		$errors    = array();
		$successes = array();

		if ( empty( $fonts_to_uninstall ) ) {
			$errors[] = new WP_Error(
				'no_fonts_to_install',
				__( 'No fonts to uninstall', 'gutenberg' )
			);
			$data     = array(
				'successes' => $successes,
				'errors'    => $errors,
			);
			$response = rest_ensure_response( $data );
			$response->set_status( 400 );
			return $response;
		}

		foreach ( $fonts_to_uninstall as $font_data ) {
			$font   = new WP_Font_Family( $font_data );
			$result = $font->uninstall();
			if ( is_wp_error( $result ) ) {
				$errors[] = $result;
			} else {
				$successes[] = $result;
			}
		}
		$data = array(
			'successes' => $successes,
			'errors'    => $errors,
		);
		return rest_ensure_response( $data );
	}

	/**
	 * Checks whether the user has permissions to update the Font Library.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the request has write access for the item, WP_Error object otherwise.
	 */
	public function update_font_library_permissions_check() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_update_font_library',
				__( 'Sorry, you are not allowed to update the Font Library on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}
		return true;
	}

	/**
	 * Checks whether the font directory exists or not.
	 *
	 * @since 6.5.0
	 *
	 * @return bool Whether the font directory exists.
	 */
	private function has_upload_directory() {
		$upload_dir = WP_Font_Library::get_fonts_dir();
		return is_dir( $upload_dir );
	}

	/**
	 * Checks whether the user has write permissions to the temp and fonts directories.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the user has write permissions, WP_Error object otherwise.
	 */
	private function has_write_permission() {
		// The update endpoints requires write access to the temp and the fonts directories.
		$temp_dir   = get_temp_dir();
		$upload_dir = WP_Font_Library::get_fonts_dir();
		if ( ! is_writable( $temp_dir ) || ! wp_is_writable( $upload_dir ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Checks whether the request needs write permissions.
	 *
	 * @since 6.5.0
	 *
	 * @param array[] $font_families Font families to install.
	 * @return bool Whether the request needs write permissions.
	 */
	private function needs_write_permission( $font_families ) {
		foreach ( $font_families as $font ) {
			if ( isset( $font['fontFace'] ) ) {
				foreach ( $font['fontFace'] as $face ) {
					// If the font is being downloaded from a URL or uploaded, it needs write permissions.
					if ( isset( $face['downloadFromUrl'] ) || isset( $face['uploadedFile'] ) ) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * Installs new fonts.
	 *
	 * Takes a request containing new fonts to install, downloads their assets, and adds them
	 * to the Font Library.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request The request object containing the new fonts to install
	 *                                 in the request parameters.
	 * @return WP_REST_Response|WP_Error The updated Font Library post content.
	 */
	public function install_fonts( $request ) {
		// Get new fonts to install.
		$fonts_param = $request->get_param( 'font_families' );

		/*
		 * As this is receiving form data, the font families are encoded as a string.
		 * The form data is used  because local fonts need to use that format to
		 * attach the files in the request.
		 */
		$fonts_to_install = json_decode( $fonts_param, true );

		$successes       = array();
		$errors          = array();
		$response_status = 200;

		if ( empty( $fonts_to_install ) ) {
			$errors[]        = new WP_Error(
				'no_fonts_to_install',
				__( 'No fonts to install', 'gutenberg' )
			);
			$response_status = 400;
		}

		if ( $this->needs_write_permission( $fonts_to_install ) ) {
			$upload_dir = WP_Font_Library::get_fonts_dir();
			if ( ! $this->has_upload_directory() ) {
				if ( ! wp_mkdir_p( $upload_dir ) ) {
					$errors[] = new WP_Error(
						'cannot_create_fonts_folder',
						sprintf(
							/* translators: %s: Directory path. */
							__( 'Error: Unable to create directory %s.', 'gutenberg' ),
							esc_html( $upload_dir )
						)
					);
					$response_status = 500;
				}
			}

			if ( $this->has_upload_directory() && ! $this->has_write_permission() ) {
				$errors[]        = new WP_Error(
					'cannot_write_fonts_folder',
					__( 'Error: WordPress does not have permission to write the fonts folder on your server.', 'gutenberg' )
				);
				$response_status = 500;
			}
		}

		if ( ! empty( $errors ) ) {
			$data     = array(
				'successes' => $successes,
				'errors'    => $errors,
			);
			$response = rest_ensure_response( $data );
			$response->set_status( $response_status );
			return $response;
		}

		// Get uploaded files (used when installing local fonts).
		$files = $request->get_file_params();
		foreach ( $fonts_to_install as $font_data ) {
			$font   = new WP_Font_Family( $font_data );
			$result = $font->install( $files );
			if ( is_wp_error( $result ) ) {
				$errors[] = $result;
			} else {
				$successes[] = $result;
			}
		}

		$data = array(
			'successes' => $successes,
			'errors'    => $errors,
		);
		return rest_ensure_response( $data );
	}
}
