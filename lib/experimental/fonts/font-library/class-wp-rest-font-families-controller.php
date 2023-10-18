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

/**
 * Font Families Controller class.
 *
 * @since 6.5.0
 */
class WP_REST_Font_Families_Controller extends WP_REST_Controller {
	/**
	 * Constructor.
	 *
	 * @since 6.5.0
	 */
	public function __construct() {
		$this->rest_base = 'font-families';
		$this->namespace = 'wp/v2';
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
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
					'args'                => array(
						'slug'       => array(
							'required' => true,
							'type'     => 'string',
						),
						'name'       => array(
							'required' => true,
							'type'     => 'string',
						),
						'fontFamily' => array(
							'required' => true,
							'type'     => 'string',
						),
						'fontFace'   => array(
							'required'          => false,
							'type'              => 'string',
							'validate_callback' => array( $this, 'validate_font_faces' ),
						),
					),
				),
				'schema' => array( $this, 'get_items_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<slug>[\/\w-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'update_font_library_permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Get item (font family).
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$font_family = new WP_Font_Family( array( 'slug' => $request['slug'] ) );
		$font_family_data = $font_family->get_data_from_post();

		if ( is_wp_error( $font_family_data ) ) {
			return $font_family_data;
		}

		$item = $this->prepare_item_for_response( $font_family_data, $request );
		return rest_ensure_response( $item );
	}

	/**
	 * Get items (font families).
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		$args     = array(
			'post_type'      => 'wp_font_family',
			'post_status'    => 'publish',
			'posts_per_page' => $request['per_page'] ?? 10,
			'paged'          => $request['page'] ?? 1,
			'orderby'        => $request['orderby'] ?? 'name',
			'order'          => $request['order'] ?? 'ASC',
		);
		$posts    = get_posts( $args );
		$response = array();
		foreach ( $posts as $post ) {
			$item = $this->prepare_item_for_response( $post, $request );
			if ( $item ) {
				$response[] = $item;
			}
		}
		return rest_ensure_response( $response );
	}

	public function prepare_item_for_response( $post, $request ) {
		return json_decode( $post->post_content, true );
	}

	/**
	 * Returns validation errors in font faces data for installation.
	 *
	 * @since 6.5.0
	 *
	 * @param array[] $font_faces Font faces to install.
	 * @param array   $files         Files to install.
	 * @return WP_Error Validation errors.
	 */
	private function get_validation_errors( $font_faces, $files ) {
		$error = new WP_Error();

		if ( ! is_array( $font_faces ) ) {
			$error->add( 'rest_invalid_param', __( 'fontFace should be an array.' ) );
			return $error;
		}

		if ( count( $font_faces ) < 1 ) {
			$error->add( 'rest_invalid_param', __( 'fontFace should have at least one item.' ) );
			return $error;
		}

		for ( $face_index = 0; $face_index < count( $font_faces ); $face_index++ ) {
			$font_face = $font_faces[ $face_index ];
			if ( ! isset( $font_face['fontWeight'] ) || ! isset( $font_face['fontStyle'] ) ) {
				$error_message = sprintf(
					// translators: 1: font face index.
					__( 'Font face (%1$s) should have fontWeight and fontStyle properties defined.' ),
					$face_index
				);
				$error->add( 'rest_invalid_param', $error_message );
			}

			if ( isset( $font_face['downloadFromUrl'] ) && isset( $font_face['uploadedFile'] ) ) {
				$error_message = sprintf(
					// translators: 1: font face index.
					__( 'Font face (%1$s) should have only one of the downloadFromUrl or uploadedFile properties defined and not both.' ),
					$face_index
				);
				$error->add( 'rest_invalid_param', $error_message );
			}

			if ( isset( $font_face['uploadedFile'] ) ) {
				if ( ! isset( $files[ $font_face['uploadedFile'] ] ) ) {
					$error_message = sprintf(
						// translators: 1: font face index.
						__( 'Font face (%1$s) file is not defined in the request files.' ),
						$face_index
					);
					$error->add( 'rest_invalid_param', $error_message );
				}
			}
		}
		return $error;
	}

	/**
	 * Validate input for the install endpoint.
	 *
	 * @since 6.5.0
	 *
	 * @param string          $param The font faces to install.
	 * @param WP_REST_Request $request The request object.
	 * @return bool|WP_Error True if the parameter is valid, WP_Error otherwise.
	 */
	public function validate_font_faces( $param, $request ) {
		$font_faces = json_decode( $param, true );
		if ( null === $font_faces ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'Invalid font faces parameter.' ),
				array( 'status' => 400 )
			);
		}

		$files      = $request->get_file_params();
		$validation = $this->get_validation_errors( $font_faces, $files );

		if ( $validation->has_errors() ) {
			$validation->add_data( array( 'status' => 400 ) );
			return $validation;
		}

		return true;
	}

	/**
	 * Removes font families from the Font Library and all their assets.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {

		$font_family = new WP_Font_Family( array( 'slug' => $request['slug'] ) );
		$result      = $font_family->uninstall();

		if ( is_wp_error( $result ) ) {
			if ( 'font_family_slug_not_found' === $result->get_error_code() ) {
				$result->add_data( array( 'status' => 404 ) );
			} else {
				$result->add_data( array( 'status' => 500 ) );
			}
		}
		return rest_ensure_response( $result );
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
				__( 'Sorry, you are not allowed to update the Font Library on this site.' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}
		return true;
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
	 * @param array $font_family Font family definition.
	 * @return bool Whether the request needs write permissions.
	 */
	private function needs_write_permission( $font_family ) {
		if ( isset( $font_family['fontFace'] ) ) {
			foreach ( $font_family['fontFace'] as $face ) {
				// If the font is being downloaded from a URL or uploaded, it needs write permissions.
				if ( isset( $face['downloadFromUrl'] ) || isset( $face['uploadedFile'] ) ) {
					return true;
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
	public function create_item( $request ) {
		$font_family_data = array(
			'slug'       => $request->get_param( 'slug' ),
			'name'       => $request->get_param( 'name' ),
			'fontFamily' => $request->get_param( 'fontFamily' ),
		);

		if ( $request->get_param( 'fontFace' ) ) {
			$font_family_data['fontFace'] = json_decode( $request->get_param( 'fontFace' ), true );
		}

		if ( $this->needs_write_permission( $font_family_data ) && ! $this->has_write_permission() ) {
			return new WP_Error(
				'cannot_write_fonts_folder',
				__( 'Error: WordPress does not have permission to write the fonts folder on your server.' ),
				array(
					'status' => 500,
				)
			);
		}

		// Get uploaded files (used when installing local fonts).
		$files       = $request->get_file_params();
		$font_family = new WP_Font_Family( $font_family_data );
		$result      = $font_family->install( $files );
		return rest_ensure_response( $result );
	}

	/**
	 * Retrieves the font family response schema
	 *
	 * @since 6.5.0
	 *
	 * @return array Font Family schema data.
	 */
	private function font_family_schema() {
		return array(
			'fontFace'   => array(
				'description' => __( 'An array of font face objects.' ),
				'type'        => 'array',
				'items'       => array(
					'type'       => 'object',
					'properties' => array(
						'fontFamily' => array(
							'description' => __( 'Name of the font family.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'fontStyle'  => array(
							'description' => __( 'Style of the font.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'fontWeight' => array(
							'description' => __( 'Weight of the font.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'src'        => array(
							'description' => __( 'Source URL of the font.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
					),
				),
			),
			'fontFamily' => array(
				'description' => __( 'CSS string for the font family.' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit', 'embed' ),
			),
			'name'       => array(
				'description' => __( 'Display name of the font.' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit', 'embed' ),
			),
			'slug'       => array(
				'description' => __( 'Slug of the font.' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit', 'embed' ),
			),
		);
	}

	/**
	 * Retrieves item schema
	 *
	 * @since 6.5.0
	 *
	 * @return array Font family schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
		$family_schema = array (
			'title'      => 'Font family',
			'type'       => 'object',
			'properties' => $this->font_family_schema(),
		);
		$delete_success_schema = array(
			'title' => 'Font family delete success',
			'type' => 'boolean',
			'description' => 'Indicates a successful response.',
			'enum' => array( true),
		);
		$schema = array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'Font family item endpoint reponse',
			'oneOf' => array( $family_schema, $delete_success_schema, $this->error_schema() ),
		);
		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the items schema.
	 *
	 * @since 6.5.0
	 *
	 * @return array Font families schema data.
	 */
	public function get_items_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
		$families_schema = array(
			'title'      => 'Font families',
			'type'       => 'array',
			'items'      => (
				array(
					'type'       => 'object',
					'properties' => $this->font_family_schema(),
				)
			)
		);
		$schema = array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'Font families items endpoint reponse',
			'oneOf' => array( $families_schema, $this->error_schema() ),
		);
		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the error response schema
	 *
	 * @since 6.5.0
	 *
	 * @return array Error schema data.
	 */
	private function error_schema () {
		return array(
			'title' => 'Error response',
			'type' => 'object',
			'properties' => array(
				'errors' => array(
					'type' => 'object',
					'description' => 'An associative array of error codes to error messages.',
					'propertyNames' => array(
						'type' => 'string',
					),
					'additionalProperties' => array(
						'type' => 'array',
						'items' => array(
							'type' => 'string',
						),
					),
				),
				'error_data' => array(
					'type' => 'object',
					'description' => 'An associative array of error codes to mixed error data.',
					'propertyNames' => array(
						'type' => 'string',
					),
					'additionalProperties' => array(
						'type' => 'string',
					),
				),
			),
		);
	}
}
