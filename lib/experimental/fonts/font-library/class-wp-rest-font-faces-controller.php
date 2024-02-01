<?php
/**
 * REST API: WP_REST_Font_Faces_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 */

if ( ! class_exists( 'WP_REST_Font_Faces_Controller' ) ) {

	/**
	 * Class to access font faces through the REST API.
	 */
	class WP_REST_Font_Faces_Controller extends WP_REST_Posts_Controller {
		/**
		 * Whether the controller supports batching.
		 *
		 * @since 6.5.0
		 * @var false
		 */
		protected $allow_batch = false;

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
				'/' . $this->rest_base,
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
						'permission_callback' => array( $this, 'get_items_permissions_check' ),
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
				'/' . $this->rest_base . '/(?P<id>[\d]+)',
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
						'permission_callback' => array( $this, 'get_item_permissions_check' ),
						'args'                => array(
							'context' => $this->get_context_param( array( 'default' => 'view' ) ),
						),
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
		 * Checks if a given request has access to font faces.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
		 */
		public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- required by parent class
			$post_type = get_post_type_object( $this->post_type );

			if ( ! current_user_can( $post_type->cap->read ) ) {
				return new WP_Error(
					'rest_cannot_read',
					__( 'Sorry, you are not allowed to access font faces.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			return true;
		}

		/**
		 * Checks if a given request has access to a font face.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
		 */
		public function get_item_permissions_check( $request ) {
			$post = $this->get_post( $request['id'] );
			if ( is_wp_error( $post ) ) {
				return $post;
			}

			if ( ! current_user_can( 'read_post', $post->ID ) ) {
				return new WP_Error(
					'rest_cannot_read',
					__( 'Sorry, you are not allowed to access this font face.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			return true;
		}

		/**
		 * Validates settings when creating a font face.
		 *
		 * @since 6.5.0
		 *
		 * @param string          $value   Encoded JSON string of font face settings.
		 * @param WP_REST_Request $request Request object.
		 * @return false|WP_Error True if the settings are valid, otherwise a WP_Error object.
		 */
		public function validate_create_font_face_settings( $value, $request ) {
			$settings = json_decode( $value, true );

			// Check settings string is valid JSON.
			if ( null === $settings ) {
				return new WP_Error(
					'rest_invalid_param',
					__( 'font_face_settings parameter must be a valid JSON string.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			// Check that the font face settings match the theme.json schema.
			$schema             = $this->get_item_schema()['properties']['font_face_settings'];
			$has_valid_settings = rest_validate_value_from_schema( $settings, $schema, 'font_face_settings' );

			if ( is_wp_error( $has_valid_settings ) ) {
				$has_valid_settings->add_data( array( 'status' => 400 ) );
				return $has_valid_settings;
			}

			// Check that none of the required settings are empty values.
			$required = $schema['required'];
			foreach ( $required as $key ) {
				if ( isset( $settings[ $key ] ) && ! $settings[ $key ] ) {
					return new WP_Error(
						'rest_invalid_param',
						/* translators: %s: Font family setting key. */
						sprintf( __( 'font_face_setting[%s] cannot be empty.', 'gutenberg' ), $key ),
						array( 'status' => 400 )
					);
				}
			}

			$srcs = is_array( $settings['src'] ) ? $settings['src'] : array( $settings['src'] );

			// Check that srcs are non-empty strings.
			$filtered_src = array_filter( array_filter( $srcs, 'is_string' ) );
			if ( empty( $filtered_src ) ) {
				return new WP_Error(
					'rest_invalid_param',
					__( 'font_face_settings[src] values must be non-empty strings.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			// Check that each file in the request references a src in the settings.
			$files = $request->get_file_params();
			foreach ( array_keys( $files ) as $file ) {
				if ( ! in_array( $file, $srcs, true ) ) {
					return new WP_Error(
						'rest_invalid_param',
						// translators: %s: File key (e.g. `file-0`) in the request data.
						sprintf( __( 'File %1$s must be used in font_face_settings[src].', 'gutenberg' ), $file ),
						array( 'status' => 400 )
					);
				}
			}

			return true;
		}

		/**
		 * Sanitizes the font face settings when creating a font face.
		 *
		 * @since 6.5.0
		 *
		 * @param string          $value   Encoded JSON string of font face settings.
		 * @param WP_REST_Request $request Request object.
		 * @return array                   Decoded array of font face settings.
		 */
		public function sanitize_font_face_settings( $value ) {
			// Settings arrive as stringified JSON, since this is a multipart/form-data request.
			$settings = json_decode( $value, true );

			if ( isset( $settings['fontFamily'] ) ) {
				$settings['fontFamily'] = WP_Font_Utils::format_font_family( $settings['fontFamily'] );
			}

			return $settings;
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
			$font_family = $this->get_parent_font_family_post( $request['font_family_id'] );
			if ( is_wp_error( $font_family ) ) {
				return $font_family;
			}

			return parent::get_items( $request );
		}

		/**
		 * Retrieves a single font face within the parent font family.
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

			// Check that the font face has a valid parent font family.
			$font_family = $this->get_parent_font_family_post( $request['font_family_id'] );
			if ( is_wp_error( $font_family ) ) {
				return $font_family;
			}

			if ( (int) $font_family->ID !== (int) $post->post_parent ) {
				return new WP_Error(
					'rest_font_face_parent_id_mismatch',
					/* translators: %d: A post id. */
					sprintf( __( 'The font face does not belong to the specified font family with id of "%d"', 'gutenberg' ), $font_family->ID ),
					array( 'status' => 404 )
				);
			}

			return parent::get_item( $request );
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
			$font_family = $this->get_parent_font_family_post( $request['font_family_id'] );
			if ( is_wp_error( $font_family ) ) {
				return $font_family;
			}

			// Settings have already been decoded by ::sanitize_font_face_settings().
			$settings    = $request->get_param( 'font_face_settings' );
			$file_params = $request->get_file_params();

			// Check that the necessary font face properties are unique.
			$query = new WP_Query(
				array(
					'post_type'              => $this->post_type,
					'posts_per_page'         => 1,
					'title'                  => WP_Font_Utils::get_font_face_slug( $settings ),
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);
			if ( ! empty( $query->get_posts() ) ) {
				return new WP_Error(
					'rest_duplicate_font_face',
					__( 'A font face matching those settings already exists.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

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
				if ( is_wp_error( $font_file ) ) {
					return $font_file;
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
			$post = $this->get_post( $request['id'] );
			if ( is_wp_error( $post ) ) {
				return $post;
			}

			$font_family = $this->get_parent_font_family_post( $request['font_family_id'] );
			if ( is_wp_error( $font_family ) ) {
				return $font_family;
			}

			if ( (int) $font_family->ID !== (int) $post->post_parent ) {
				return new WP_Error(
					'rest_font_face_parent_id_mismatch',
					/* translators: %d: A post id. */
					sprintf( __( 'The font face does not belong to the specified font family with id of "%d"', 'gutenberg' ), $font_family->ID ),
					array( 'status' => 404 )
				);
			}

			$force = isset( $request['force'] ) ? (bool) $request['force'] : false;

			// We don't support trashing for font faces.
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
		public function prepare_item_for_response( $item, $request ) {
			$fields = $this->get_fields_for_response( $request );
			$data   = array();

			if ( rest_is_field_included( 'id', $fields ) ) {
				$data['id'] = $item->ID;
			}
			if ( rest_is_field_included( 'theme_json_version', $fields ) ) {
				$data['theme_json_version'] = 2;
			}

			if ( rest_is_field_included( 'parent', $fields ) ) {
				$data['parent'] = $item->post_parent;
			}

			if ( rest_is_field_included( 'font_face_settings', $fields ) ) {
				$data['font_face_settings'] = $this->get_settings_from_post( $item );
			}

			$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
			$data    = $this->add_additional_fields_to_object( $data, $request );
			$data    = $this->filter_response_by_context( $data, $context );

			$response = rest_ensure_response( $data );

			if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
				$links = $this->prepare_links( $item );
				$response->add_links( $links );
			}

			/**
			 * Filters the font face data for a REST API response.
			 *
			 * @since 6.5.0
			 *
			 * @param WP_REST_Response $response The response object.
			 * @param WP_Post          $post     Font face post object.
			 * @param WP_REST_Request  $request  Request object.
			 */
			return apply_filters( 'rest_prepare_wp_font_face', $response, $item, $request );
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
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),
					'theme_json_version' => array(
						'description' => __( 'Version of the theme.json schema used for the typography settings.', 'gutenberg' ),
						'type'        => 'integer',
						'default'     => 2,
						'minimum'     => 2,
						'maximum'     => 2,
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					'parent'             => array(
						'description' => __( 'The ID for the parent font family of the font face.', 'gutenberg' ),
						'type'        => 'integer',
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					// Font face settings come directly from theme.json schema
					// See https://schemas.wp.org/trunk/theme.json
					'font_face_settings' => array(
						'description'          => __( 'font-face declaration in theme.json format.', 'gutenberg' ),
						'type'                 => 'object',
						'context'              => array( 'view', 'edit', 'embed' ),
						'properties'           => array(
							'fontFamily'            => array(
								'description' => __( 'CSS font-family value.', 'gutenberg' ),
								'type'        => 'string',
								'default'     => '',
							),
							'fontStyle'             => array(
								'description' => __( 'CSS font-style value.', 'gutenberg' ),
								'type'        => 'string',
								'default'     => 'normal',
							),
							'fontWeight'            => array(
								'description' => __( 'List of available font weights, separated by a space.', 'gutenberg' ),
								'default'     => '400',
								// Changed from `oneOf` to avoid errors from loose type checking.
								// e.g. a fontWeight of "400" validates as both a string and an integer due to is_numeric check.
								'type'        => array( 'string', 'integer' ),
							),
							'fontDisplay'           => array(
								'description' => __( 'CSS font-display value.', 'gutenberg' ),
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
								'description' => __( 'Paths or URLs to the font files.', 'gutenberg' ),
								// Changed from `oneOf` to `anyOf` due to rest_sanitize_array converting a string into an array.
								'anyOf'       => array(
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
								'description' => __( 'CSS font-stretch value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'ascentOverride'        => array(
								'description' => __( 'CSS ascent-override value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'descentOverride'       => array(
								'description' => __( 'CSS descent-override value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'fontVariant'           => array(
								'description' => __( 'CSS font-variant value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'fontFeatureSettings'   => array(
								'description' => __( 'CSS font-feature-settings value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'fontVariationSettings' => array(
								'description' => __( 'CSS font-variation-settings value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'lineGapOverride'       => array(
								'description' => __( 'CSS line-gap-override value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'sizeAdjust'            => array(
								'description' => __( 'CSS size-adjust value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'unicodeRange'          => array(
								'description' => __( 'CSS unicode-range value.', 'gutenberg' ),
								'type'        => 'string',
							),
							'preview'               => array(
								'description' => __( 'URL to a preview image of the font face.', 'gutenberg' ),
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
			$query_params = parent::get_collection_params();

			// Remove unneeded params.
			unset( $query_params['after'] );
			unset( $query_params['modified_after'] );
			unset( $query_params['before'] );
			unset( $query_params['modified_before'] );
			unset( $query_params['search'] );
			unset( $query_params['search_columns'] );
			unset( $query_params['slug'] );
			unset( $query_params['status'] );

			$query_params['orderby']['default'] = 'id';
			$query_params['orderby']['enum']    = array( 'id', 'include' );

			/**
			 * Filters collection parameters for the font face controller.
			 *
			 * @since 6.5.0
			 *
			 * @param array $query_params JSON Schema-formatted collection parameters.
			 */
			return apply_filters( 'rest_wp_font_face_collection_params', $query_params );
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
				// When creating, font_face_settings is stringified JSON, to work with multipart/form-data used
				// when uploading font files.
				'font_face_settings' => array(
					'description'       => __( 'font-face declaration in theme.json format, encoded as a string.', 'gutenberg' ),
					'type'              => 'string',
					'required'          => true,
					'validate_callback' => array( $this, 'validate_create_font_face_settings' ),
					'sanitize_callback' => array( $this, 'sanitize_font_face_settings' ),
				),
			);
		}

		/**
		 * Get the parent font family, if the ID is valid.
		 *
		 * @since 6.5.0
		 *
		 * @param int $font_family_id Supplied ID.
		 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
		 */
		protected function get_parent_font_family_post( $font_family_id ) {
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
			|| 'wp_font_family' !== $font_family_post->post_type
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
					'href' => rest_url( $this->namespace . '/font-families/' . $post->post_parent . '/font-faces/' . $post->ID ),
				),
				'collection' => array(
					'href' => rest_url( $this->namespace . '/font-families/' . $post->post_parent . '/font-faces' ),
				),
				'parent'     => array(
					'href' => rest_url( $this->namespace . '/font-families/' . $post->post_parent ),
				),
			);

			return $links;
		}

		/**
		 * Prepares a single font face post for creation.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_REST_Request $request Request object.
		 * @return stdClass|WP_Error Post object or WP_Error.
		 */
		protected function prepare_item_for_database( $request ) {
			$prepared_post = new stdClass();

			// Settings have already been decoded by ::sanitize_font_face_settings().
			$settings = $request->get_param( 'font_face_settings' );

			// Store this "slug" as the post_title rather than post_name, since it uses the fontFamily setting,
			// which may contain multibyte characters.
			$title = WP_Font_Utils::get_font_face_slug( $settings );

			$prepared_post->post_type    = $this->post_type;
			$prepared_post->post_parent  = $request['font_family_id'];
			$prepared_post->post_status  = 'publish';
			$prepared_post->post_title   = $title;
			$prepared_post->post_name    = sanitize_title( $title );
			$prepared_post->post_content = wp_json_encode( $settings );

			return $prepared_post;
		}

		/**
		 * Handles the upload of a font file using wp_handle_upload().
		 *
		 * @since 6.5.0
		 *
		 * @param array $file Single file item from $_FILES.
		 * @return array Array containing uploaded file attributes on success, or error on failure.
		 */
		protected function handle_font_file_upload( $file ) {
			add_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );
			add_filter( 'upload_dir', 'wp_get_font_dir' );

			$overrides = array(
				'upload_error_handler' => array( $this, 'handle_font_file_upload_error' ),
				// Arbitrary string to avoid the is_uploaded_file() check applied
				// when using 'wp_handle_upload'.
				'action'               => 'wp_handle_font_upload',
				// Not testing a form submission.
				'test_form'            => false,
				// Seems mime type for files that are not images cannot be tested.
				// See wp_check_filetype_and_ext().
				'test_type'            => true,
				// Only allow uploading font files for this request.
				'mimes'                => WP_Font_Library::get_expected_font_mime_types_per_php_version(),
			);

			$uploaded_file = wp_handle_upload( $file, $overrides );

			remove_filter( 'upload_dir', 'wp_get_font_dir' );
			remove_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );

			return $uploaded_file;
		}

		/**
		 * Handles file upload error.
		 *
		 * @since 6.5.0
		 *
		 * @param array  $file    File upload data.
		 * @param string $message Error message from wp_handle_upload().
		 * @return WP_Error WP_Error object.
		 */
		public function handle_font_file_upload_error( $file, $message ) {
			$status = 500;
			$code   = 'rest_font_upload_unknown_error';

			if ( __( 'Sorry, you are not allowed to upload this file type.', 'default' ) === $message ) {
				$status = 400;
				$code   = 'rest_font_upload_invalid_file_type';
			}

			return new WP_Error( $code, $message, array( 'status' => $status ) );
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

			$fonts_dir = wp_get_font_dir();
			if ( str_starts_with( $new_path, $fonts_dir['path'] ) ) {
				$new_path = str_replace( $fonts_dir, '', $new_path );
				$new_path = ltrim( $new_path, '/' );
			}

			return $new_path;
		}

		/**
		 * Gets the font face's settings from the post.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Post $post Font face post object.
		 * @return array Font face settings array.
		 */
		protected function get_settings_from_post( $post ) {
			$settings   = json_decode( $post->post_content, true );
			$properties = $this->get_item_schema()['properties']['font_face_settings']['properties'];

			// Provide required, empty settings if needed.
			if ( null === $settings ) {
				$settings = array(
					'fontFamily' => '',
					'src'        => array(),
				);
			}

			// Only return the properties defined in the schema.
			return array_intersect_key( $settings, $properties );
		}
	}
}
