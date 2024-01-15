<?php
/**
 * REST API: WP_REST_Font_Families_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
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
		$post_type       = 'wp_font_family';
		$this->post_type = $post_type;

		$post_type_obj   = get_post_type_object( $post_type );
		$this->rest_base = $post_type_obj->rest_base;
		$this->namespace = $post_type_obj->rest_namespace;
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
					'permission_callback' => array( $this, 'get_font_families_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_create_edit_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the font family.', 'gutenberg' ),
					'type'        => 'integer',
					'required'    => true,
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_font_families_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_create_edit_params(),
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
			)
		);
	}

	/**
	 * Checks if a given request has access to font families.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_font_families_permissions_check() {
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

	/**
	 * Validates settings when creating or updating a font family.
	 *
	 * @since 6.5.0
	 *
	 * @param string          $value   Encoded JSON string of font family settings.
	 * @param WP_REST_Request $request Request object.
	 * @return false|WP_Error True if the settings are valid, otherwise a WP_Error object.
	 */
	public function validate_font_family_settings( $value, $request ) {
		$settings = json_decode( $value, true );

		// Check settings string is valid JSON.
		if ( null === $settings ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'font_family_settings parameter must be a valid JSON string.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$schema   = $this->get_item_schema()['properties']['font_family_settings'];
		$required = $schema['required'];

		if ( isset( $request['id'] ) ) {
			// Allow sending individual properties if we are updating an existing font family.
			unset( $schema['required'] );

			// But don't allow updating the slug, since it is used as a unique identifier.
			if ( isset( $settings['slug'] ) ) {
				return new WP_Error(
					'rest_invalid_param',
					__( 'font_family_settings[slug] cannot be updated.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}
		}

		// Check that the font face settings match the theme.json schema.
		$has_valid_settings = rest_validate_value_from_schema( $settings, $schema, 'font_family_settings' );

		if ( is_wp_error( $has_valid_settings ) ) {
			$has_valid_settings->add_data( array( 'status' => 400 ) );
			return $has_valid_settings;
		}

		// Check that none of the required settings are empty values.
		foreach ( $required as $key ) {
			if ( isset( $settings[ $key ] ) && ! $settings[ $key ] ) {
				return new WP_Error(
					'rest_invalid_param',
					/* translators: %s: Font family setting key. */
					sprintf( __( 'font_family_settings[%s] cannot be empty.', 'gutenberg' ), $key ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Sanitizes the font family settings when creating or updating a font family.
	 *
	* @since 6.5.0
	 *
	 * @param string          $value   Encoded JSON string of font family settings.
	 * @param WP_REST_Request $request Request object.
	 * @return array                   Decoded array font family settings.
	 */
	public function sanitize_font_family_settings( $value ) {
		$settings = json_decode( $value, true );

		if ( isset( $settings['fontFamily'] ) ) {
			$settings['fontFamily'] = WP_Font_Family_Utils::format_font_family( $settings['fontFamily'] );
		}

		// Provide default for preview, if not provided.
		if ( ! isset( $settings['preview'] ) ) {
			$settings['preview'] = '';
		}

		return $settings;
	}

	/**
	 * Creates a single font family.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$settings = $request->get_param( 'font_family_settings' );

		// Check that the font family slug is unique.
		$existing_font_family = get_posts(
			array(
				'post_type'      => $this->post_type,
				'posts_per_page' => 1,
				'name'           => $settings['slug'],
			)
		);
		if ( ! empty( $existing_font_family ) ) {
			return new WP_Error(
				'rest_duplicate_font_family',
				/* translators: %s: Font family slug. */
				sprintf( __( 'A font family with slug "%s" already exists.', 'gutenberg' ), $settings['slug'] ),
				array( 'status' => 400 )
			);
		}

		return parent::create_item( $request );
	}

	/**
	 * Deletes a single font family.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$font_family_id = $request->get_param( 'id' );
		$force          = isset( $request['force'] ) ? (bool) $request['force'] : false;

		// We don't support trashing for revisions.
		if ( ! $force ) {
			return new WP_Error(
				'rest_trash_not_supported',
				/* translators: %s: force=true */
				sprintf( __( "Font faces do not support trashing. Set '%s' to delete.", 'gutenberg' ), 'force=true' ),
				array( 'status' => 501 )
			);
		}

		$deleted = parent::delete_item( $request );

		if ( is_wp_error( $deleted ) ) {
			return $deleted;
		}

		foreach ( $this->get_font_face_ids( $font_family_id ) as $font_face_id ) {
			wp_delete_post( $font_face_id, true );
		}
	}

	/**
	 * Prepares a single font family output for response.
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
		$data['font_faces']         = $this->get_font_face_ids( $item->ID );

		$settings   = json_decode( $item->post_content, true );
		$properties = $this->get_item_schema()['properties']['font_family_settings']['properties'];

		// Provide empty settings if the post_content is not valid JSON.
		if ( null === $settings ) {
			$settings = array(
				'name'       => '',
				'slug'       => '',
				'fontFamily' => '',
				'preview'    => '',
			);
		}

		// Only return the properties defined in the schema.
		$data['font_family_settings'] = array_intersect_key( $settings, $properties );

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
				'id'                   => array(
					'description' => __( 'Unique identifier for the post.', 'default' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'theme_json_version'   => array(
					'description' => __( 'Version of the theme.json schema used for the typography settings.', 'gutenberg' ),
					'type'        => 'integer',
					'default'     => 2,
					'minimum'     => 2,
					'maximum'     => 2,
				),
				'font_faces'           => array(
					'description' => __( 'The IDs of the child font faces in the font family.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'integer',
					),
				),
				// Font family settings come directly from theme.json schema
				// See https://schemas.wp.org/trunk/theme.json
				'font_family_settings' => array(
					'description'          => __( 'font-face declaration in theme.json format.', 'gutenberg' ),
					'type'                 => 'object',
					'properties'           => array(
						'name'       => array(
							'description' => 'Name of the font family preset, translatable.',
							'type'        => 'string',
						),
						'slug'       => array(
							'description' => 'Kebab-case unique identifier for the font family preset.',
							'type'        => 'string',
						),
						'fontFamily' => array(
							'description' => 'CSS font-family value.',
							'type'        => 'string',
						),
						'preview'    => array(
							'description' => 'URL to a preview image of the font family.',
							'type'        => 'string',
						),
					),
					'required'             => array( 'name', 'slug', 'fontFamily' ),
					'additionalProperties' => false,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for the font family collection.
	 *
	 * @since 6.5.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();

		return array(
			'page'     => $params['page'],
			'per_page' => $params['per_page'],
			'search'   => $params['search'],
			'slug'     => $params['slug'],
		);
	}

	/**
	 * Checks if a given request has access to read font families.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the request has read access, otherwise a WP_Error object.
	 */
	public function get_font_family_permissions_check() {
		$post_type = get_post_type_object( $this->post_type );

		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to access font families.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get the params used when creating or updating a font family.
	 *
	 * @since 6.5.0
	 *
	 * @return array Font family create/edit arguments.
	 */
	public function get_create_edit_params() {
		$properties = $this->get_item_schema()['properties'];
		return array(
			'theme_json_version'   => $properties['theme_json_version'],
			// Font family settings is stringified JSON, to work with multipart/form-data.
			// Font families don't currently support file uploads, but may accept preview files in the future.
			'font_family_settings' => array(
				'description'       => __( 'font-family declaration in theme.json format, encoded as a string.', 'gutenberg' ),
				'type'              => 'string',
				'required'          => true,
				'validate_callback' => array( $this, 'validate_font_family_settings' ),
				'sanitize_callback' => array( $this, 'sanitize_font_family_settings' ),
			),
		);
	}

	/**
	 * Get the child font face post IDs.
	 *
	 * @since 6.5.0
	 *
	 * @param int $font_family_id Font family post ID.
	 * @return int[] Array of child font face post IDs.
	 * .
	 */
	protected function get_font_face_ids( $font_family_id ) {
		$font_face_ids = get_posts(
			array(
				'fields'         => 'ids',
				'post_parent'    => $font_family_id,
				'post_type'      => 'wp_font_face',
				'posts_per_page' => 999,
			)
		);
		return $font_face_ids;
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
		$links = parent::prepare_links( $post );

		return array(
			'self'       => $links['self'],
			'collection' => $links['collection'],
			'font_faces' => $this->prepare_font_face_links( $post->ID ),
		);
	}

	protected function prepare_font_face_links( $font_family_id ) {
		$font_face_ids = $this->get_font_face_ids( $font_family_id );
		$links         = array();
		foreach ( $font_face_ids as $font_face_id ) {
			$links[] = array(
				'embeddable' => true,
				'href'       => rest_url( $this->namespace . '/' . $this->rest_base . '/' . $font_family_id . '/font-faces/' . $font_face_id ),
			);
		}
		return $links;
	}

	/**
	 * Prepares a single font family post for create or update.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Post object or WP_Error.
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared_post = new stdClass();
		// Settings have already been decoded by sanitize_font_family_settings().
		$settings = $request->get_param( 'font_family_settings' );

		if ( isset( $request['id'] ) ) {
			$existing_post = $this->get_post( $request['id'] );
			if ( is_wp_error( $existing_post ) ) {
				return $existing_post;
			}

			$prepared_post->ID = $existing_post->ID;
			$existing_settings = json_decode( $existing_post->post_content, true );
			$settings          = array_merge( $existing_settings, $settings );
		}

		$prepared_post->post_type    = $this->post_type;
		$prepared_post->post_status  = 'publish';
		$prepared_post->post_title   = $settings['name'];
		$prepared_post->post_name    = sanitize_title( $settings['slug'] );
		$prepared_post->post_content = wp_json_encode( $settings );

		return $prepared_post;
	}
}
