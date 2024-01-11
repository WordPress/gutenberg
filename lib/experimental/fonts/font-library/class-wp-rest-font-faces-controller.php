<?php
/**
 * REST API: WP_REST_Font_Faces_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 */

if ( class_exists( 'WP_REST_Font_Faces_Controller' ) ) {
	return;
}

/**
 * Class to access font faces through the REST API.
 */
class WP_REST_Font_Faces_Controller extends WP_REST_Posts_Controller {
	/**
	 * The base of the parent Font Family controller's route.
	 *
	 * @since 6.5.0
	 * @var string
	 */
	private $parent_base;

	/**
	 * Parent font family post type
	 *
	 * @since 6.5.0
	 * @var string
	 */
	private $parent_post_type;

	public function __construct() {
		$post_type       = 'wp_font_face';
		$this->post_type = $post_type;

		$post_type_obj   = get_post_type_object( $post_type );
		$this->rest_base = $post_type_obj->rest_base;

		$parent_post_type       = 'wp_font_family';
		$this->parent_post_type = $parent_post_type;
		$parent_post_type_obj   = get_post_type_object( $parent_post_type );
		$this->parent_base      = $parent_post_type_obj->rest_base;
		$this->namespace        = $parent_post_type_obj->rest_namespace;
	}

	/**
	 * Registers the routes for posts.
	 *
	 * @since 6.5.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<font_family_id>[\d]+)/' . $this->rest_base,
			array(
				'args'   => array(
					'font_family_id' => array(
						'description' => __( 'The ID for the parent font family of the font face.', 'gutenberg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_font_faces_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_create_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<font_family_id>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'   => array(
					'font_family_id' => array(
						'description' => __( 'The ID for the parent font family of the font face.', 'gutenberg' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'id'             => array(
						'description' => __( 'Unique identifier for the font face.', 'gutenberg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_font_faces_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass Trash and force deletion.', 'default' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read posts.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_font_faces_permissions_check() {
		$post_type = get_post_type_object( $this->post_type );

		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to access font faces.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	public function validate_create_font_face_settings( $value, $request ) {
		$settings = json_decode( $value, true );
		$schema   = $this->get_item_schema()['properties']['font_face_settings'];

		// Check that the font face settings match the theme.json schema.
		$valid_settings = rest_validate_value_from_schema( $settings, $schema, 'font_face_settings' );

		// Some properties trigger a multiple "oneOf" types error that we ignore, because they are still valid.
		// e.g. a fontWeight of "400" validates as both a string and an integer due to is_numeric type checking.
		if ( is_wp_error( $valid_settings ) && $valid_settings->get_error_code() !== 'rest_one_of_multiple_matches' ) {
			$valid_settings->add_data( array( 'status' => 400 ) );
			return $valid_settings;
		}

		$srcs  = is_array( $settings['src'] ) ? $settings['src'] : array( $settings['src'] );
		$files = $request->get_file_params();

		// Check that each file in the request references a src in the settings.
		foreach ( array_keys( $files ) as $file ) {
			if ( ! in_array( $file, $srcs, true ) ) {
				return new WP_Error(
					'rest_invalid_param',
					/* translators: %s: A URL. */
					__( 'Every file uploaded must be used as a font face src.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}
		}

		// Check that src strings are non-empty.
		foreach ( $srcs as $src ) {
			if ( ! $src ) {
				return new WP_Error(
					'rest_invalid_param',
					__( 'Font face src values must be non-empty strings.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Retrieves a collection of font faces within the parent font family.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$font_family = $this->get_font_family_post( $request['font_family_id'] );
		if ( is_wp_error( $font_family ) ) {
			return $font_family;
		}

		return parent::get_items( $request );
	}

	/**
	 * Retrieves a single font face for within parent font family.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$font_family = $this->get_font_family_post( $request['font_family_id'] );
		if ( is_wp_error( $font_family ) ) {
			return $font_family;
		}

		$response = parent::get_item( $request );

		if ( (int) $font_family->ID !== (int) $response->data['parent'] ) {
			return new WP_Error(
				'rest_font_face_parent_id_mismatch',
				/* translators: %d: A post id. */
				sprintf( __( 'The font face does not belong to the specified font family with id of "%d"', 'gutenberg' ), $font_family->ID ),
				array( 'status' => 404 )
			);
		}

		return $response;
	}

	/**
	 * Creates a font face for the parent font family.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		// Settings arrive as stringified JSON, since this is a multipart/form-data request.
		$settings    = json_decode( $request->get_param( 'font_face_settings' ), true );
		$file_params = $request->get_file_params();

		// Move the uploaded font asset from the temp folder to the fonts directory.
		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$srcs           = is_string( $settings['src'] ) ? array( $settings['src'] ) : $settings['src'];
		$processed_srcs = array();
		$font_file_meta = array();

		foreach ( $srcs as $src ) {
			// If src not a file reference, use it as is.
			if ( ! isset( $file_params[ $src ] ) ) {
				$processed_srcs[] = $src;
				continue;
			}

			$file      = $file_params[ $src ];
			$font_file = $this->handle_font_file_upload( $file );
			if ( isset( $font_file['error'] ) ) {
				return new WP_Error(
					'rest_font_upload_unknown_error',
					$font_file['error'],
					array( 'status' => 500 )
				);
			}

			$processed_srcs[] = $font_file['url'];
			$font_file_meta[] = $this->relative_fonts_path( $font_file['file'] );
		}

		// Store the updated settings for prepare_item_for_database to use.
		$settings['src'] = count( $processed_srcs ) === 1 ? $processed_srcs[0] : $processed_srcs;
		$request->set_param( 'font_face_settings', $settings );

		// Ensure that $settings data is slashed, so values with quotes are escaped.
		// WP_REST_Posts_Controller::create_item uses wp_slash() on the post_content.
		$font_face_post = parent::create_item( $request );

		if ( is_wp_error( $font_face_post ) ) {
			return $font_face_post;
		}

		$font_face_id = $font_face_post->data['id'];

		foreach ( $font_file_meta as $font_file_path ) {
			add_post_meta( $font_face_id, '_wp_font_face_file', $font_file_path );
		}

		return $font_face_post;
	}

	/**
	 * Deletes a single font face.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$force = isset( $request['force'] ) ? (bool) $request['force'] : false;

		// We don't support trashing for revisions.
		if ( ! $force ) {
			return new WP_Error(
				'rest_trash_not_supported',
				/* translators: %s: force=true */
				sprintf( __( "Font faces do not support trashing. Set '%s' to delete.", 'gutenberg' ), 'force=true' ),
				array( 'status' => 501 )
			);
		}

		return parent::delete_item( $request );
	}

	/**
	 * Prepares a single font face output for response.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Post         $item    Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- required by parent class
		$data = array();

		$data['id']                 = $item->ID;
		$data['theme_json_version'] = 2;
		$data['parent']             = $item->post_parent;
		$data['font_face_settings'] = json_decode( $item->post_content, true );

		$response = rest_ensure_response( $data );
		$links    = $this->prepare_links( $item );
		$response->add_links( $links );

		return $response;
	}

	/**
	 * Retrieves the post's schema, conforming to JSON Schema.
	 *
	 * @since 6.5.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => $this->post_type,
			'type'       => 'object',
			// Base properties for every Post.
			'properties' => array(
				'id'                 => array(
					'description' => __( 'Unique identifier for the post.', 'default' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'theme_json_version' => array(
					'description' => __( 'Version of the theme.json schema used for the font face typography settings.', 'gutenberg' ),
					'type'        => 'integer',
					'default'     => 2,
					'minimum'     => 2,
					'maximum'     => 2,
				),
				'parent'             => array(
					'description' => __( 'The ID for the parent font family of the font face.', 'gutenberg' ),
					'type'        => 'integer',
				),
				// Font face settings come directly from theme.json schema
				// See https://schemas.wp.org/trunk/theme.json
				'font_face_settings' => array(
					'description'          => __( 'font-face declaration in theme.json format.', 'gutenberg' ),
					'type'                 => 'object',
					'properties'           => array(
						'fontFamily'            => array(
							'description' => 'CSS font-family value.',
							'type'        => 'string',
							'default'     => '',
						),
						'fontStyle'             => array(
							'description' => 'CSS font-style value.',
							'type'        => 'string',
							'default'     => 'normal',
						),
						'fontWeight'            => array(
							'description' => 'List of available font weights, separated by a space.',
							'default'     => '400',
							'oneOf'       => array(
								array(
									'type' => 'string',
								),
								array(
									'type' => 'integer',
								),
							),
						),
						'fontDisplay'           => array(
							'description' => 'CSS font-display value.',
							'type'        => 'string',
							'default'     => 'fallback',
							'enum'        => array(
								'auto',
								'block',
								'fallback',
								'swap',
								'optional',
							),
						),
						'src'                   => array(
							'description' => 'Paths or URLs to the font files.',
							'oneOf'       => array(
								array(
									'type' => 'string',
								),
								array(
									'type'  => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
							),
							'default'     => array(),
						),
						'fontStretch'           => array(
							'description' => 'CSS font-stretch value.',
							'type'        => 'string',
						),
						'ascentOverride'        => array(
							'description' => 'CSS ascent-override value.',
							'type'        => 'string',
						),
						'descentOverride'       => array(
							'description' => 'CSS descent-override value.',
							'type'        => 'string',
						),
						'fontVariant'           => array(
							'description' => 'CSS font-variant value.',
							'type'        => 'string',
						),
						'fontFeatureSettings'   => array(
							'description' => 'CSS font-feature-settings value.',
							'type'        => 'string',
						),
						'fontVariationSettings' => array(
							'description' => 'CSS font-variation-settings value.',
							'type'        => 'string',
						),
						'lineGapOverride'       => array(
							'description' => 'CSS line-gap-override value.',
							'type'        => 'string',
						),
						'sizeAdjust'            => array(
							'description' => 'CSS size-adjust value.',
							'type'        => 'string',
						),
						'unicodeRange'          => array(
							'description' => 'CSS unicode-range value.',
							'type'        => 'string',
						),
						'preview'               => array(
							'description' => 'URL to a preview image of the font face.',
							'type'        => 'string',
						),
					),
					'required'             => array( 'fontFamily', 'src' ),
					'additionalProperties' => false,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for the font face collection.
	 *
	 * @since 6.5.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return array(
			'page'     => array(
				'description'       => __( 'Current page of the collection.', 'default' ),
				'type'              => 'integer',
				'default'           => 1,
				'sanitize_callback' => 'absint',
				'validate_callback' => 'rest_validate_request_arg',
				'minimum'           => 1,
			),
			'per_page' => array(
				'description'       => __( 'Maximum number of items to be returned in result set.', 'default' ),
				'type'              => 'integer',
				'default'           => 10,
				'minimum'           => 1,
				'maximum'           => 100,
				'sanitize_callback' => 'absint',
				'validate_callback' => 'rest_validate_request_arg',
			),
			'search'   => array(
				'description'       => __( 'Limit results to those matching a string.', 'default' ),
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => 'rest_validate_request_arg',
			),
		);
	}

	/**
	 * Get the params used when creating a new font face.
	 *
	 * @since 6.5.0
	 *
	 * @return array Font face create arguments.
	 */
	public function get_create_params() {
		$properties = $this->get_item_schema()['properties'];
		return array(
			'theme_json_version' => $properties['theme_json_version'],
			// Font face settings is stringified JSON, to work with multipart/form-data used
			// when uploading font files.
			'font_face_settings' => array(
				'description'       => __( 'font-face declaration in theme.json format, encoded as a string.', 'gutenberg' ),
				'type'              => 'string',
				'required'          => true,
				'validate_callback' => array( $this, 'validate_create_font_face_settings' ),
			),
		);
	}

	/**
	 * Allow the font face post type to be managed through the REST API.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Post_Type|string $post_type Post type name or object.
	 * @return bool Whether the post type is allowed in REST.
	 */
	protected function check_is_post_type_allowed( $post_type ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- required by parent class
		return true;
	}

	/**
	 * Get the parent font family, if the ID is valid.
	 *
	 * @since 6.5.0
	 *
	 * @param int $font_family_id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_font_family_post( $font_family_id ) {
		$error = new WP_Error(
			'rest_post_invalid_parent',
			__( 'Invalid post parent ID.', 'default' ),
			array( 'status' => 404 )
		);

		if ( (int) $font_family_id <= 0 ) {
			return $error;
		}

		$font_family_post = get_post( (int) $font_family_id );

		if ( empty( $font_family_post ) || empty( $font_family_post->ID )
		|| $this->parent_post_type !== $font_family_post->post_type
		) {
			return $error;
		}

		return $font_family_post;
	}

	/**
	 * Prepares links for the request.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Post $post Post object.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $post ) {
		// Entity meta.
		$links = array(
			'self'       => array(
				'href' => rest_url( $this->namespace . '/' . $this->parent_base . '/' . $post->post_parent . '/' . $this->rest_base . '/' . $post->ID ),
			),
			'collection' => array(
				'href' => rest_url( $this->namespace . '/' . $this->parent_base . '/' . $post->post_parent . '/' . $this->rest_base ),
			),
			'parent'     => array(
				'href' => rest_url( $this->namespace . '/' . $this->parent_base . '/' . $post->post_parent ),
			),
		);

		return $links;
	}

	protected function prepare_item_for_database( $request ) {
		$prepared_post = new stdClass();

		// Settings have already been decoded and processed by create_item().
		$settings = $request->get_param( 'font_face_settings' );

		$prepared_post->post_type    = $this->post_type;
		$prepared_post->post_parent  = $request['font_family_id'];
		$prepared_post->post_status  = 'publish';
		$prepared_post->post_title   = $settings['fontFamily'];
		$prepared_post->post_name    = sanitize_title( $settings['fontFamily'] );
		$prepared_post->post_content = wp_json_encode( $settings );

		return $prepared_post;
	}

	protected function handle_font_file_upload( $file ) {
		add_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );
		add_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );

		$overrides = array(
			// Arbitrary string to avoid the is_uploaded_file() check applied
			// when using 'wp_handle_upload'.
			'action'    => 'wp_handle_font_upload',
			// Not testing a form submission.
			'test_form' => false,
			// Seems mime type for files that are not images cannot be tested.
			// See wp_check_filetype_and_ext().
			'test_type' => true,
		);

		$uploaded_file = wp_handle_upload( $file, $overrides );

		remove_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		remove_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );

		return $uploaded_file;
	}

	/**
	* Returns relative path to an uploaded font file.
	*
	* The path is relative to the current fonts dir.
	*
	* @since 6.5.0
	* @access private
	*
	* @param string $path Full path to the file.
	* @return string Relative path on success, unchanged path on failure.
	*/
	protected function relative_fonts_path( $path ) {
		$new_path = $path;

		$fonts_dir = WP_Font_Library::get_fonts_dir();
		if ( str_starts_with( $new_path, $fonts_dir ) ) {
			$new_path = str_replace( $fonts_dir, '', $new_path );
			$new_path = ltrim( $new_path, '/' );
		}

		return $new_path;
	}
}
