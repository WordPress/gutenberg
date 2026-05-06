<?php
/**
 * REST API: WP_REST_User_Post_Types_Controller_Gutenberg class
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( class_exists( 'WP_REST_User_Post_Types_Controller_Gutenberg' ) ) {
	return;
}

/**
 * REST controller for user-defined post types.
 *
 * Extends `WP_REST_Posts_Controller` because user post types are stored
 * as posts of the private `wp_user_post_type` CPT, not as registered
 * post types — each record is the registration intent for a post type,
 * registered on `init` by `gutenberg_register_user_defined_post_types()`.
 */
class WP_REST_User_Post_Types_Controller_Gutenberg extends WP_REST_Posts_Controller {

	/**
	 * Allowed keys inside the stored `config.labels` object. Anything outside
	 * this list is dropped at sanitization time via the schema's
	 * `additionalProperties: false`. The client mirrors this in
	 * `STRING_LABEL_KEYS` (packages/user-post-types/src/utils.ts) — drift is
	 * caught loudly: client-only keys get a 400 from the schema, server-only
	 * additions just don't render in the form.
	 *
	 * @return string[]
	 */
	private static function get_allowed_label_keys() {
		return array(
			'singular_name',
			'menu_name',
			'all_items',
			'add_new',
			'add_new_item',
			'edit_item',
			'new_item',
			'view_item',
			'view_items',
			'search_items',
			'not_found',
			'not_found_in_trash',
			'parent_item_colon',
			'archives',
			'attributes',
			'insert_into_item',
			'uploaded_to_this_item',
			'featured_image',
			'set_featured_image',
			'remove_featured_image',
			'use_featured_image',
			'filter_items_list',
			'items_list_navigation',
			'items_list',
		);
	}

	/**
	 * Allowed values inside the stored `config.supports` array. Mirrored on
	 * the client by `SUPPORT_FEATURES` (packages/user-post-types/src/utils.ts).
	 * Enforced via `items.enum` in the schema so unknown features get a 400
	 * at write time, the same way unknown label keys do.
	 *
	 * @return string[]
	 */
	private static function get_allowed_supports() {
		return array(
			'title',
			'editor',
			'thumbnail',
			'excerpt',
			'comments',
			'revisions',
			'author',
			'page-attributes',
			'custom-fields',
			'trackbacks',
			'post-formats',
		);
	}

	/**
	 * Returns the typed schema for the `config` blob stored in `post_content`.
	 * Single source of truth on the server: `get_item_schema()` embeds it as
	 * the REST `config` property, and `gutenberg_user_post_type_sanitize_config`
	 * feeds it to `rest_sanitize_value_from_schema()` at write time.
	 *
	 * Mirrors the fields the materializer (`gutenberg_build_user_post_type_args`)
	 * actually consumes — adding a field here without consuming it stores dead
	 * data, and consuming a field that isn't here lets unsanitized values reach
	 * `register_post_type()`.
	 *
	 * @return array
	 */
	public static function get_config_schema() {
		$label_props = array();
		foreach ( self::get_allowed_label_keys() as $key ) {
			// Headroom over the longest translated core label.
			$label_props[ $key ] = array(
				'type'      => 'string',
				'maxLength' => 200,
			);
		}
		return array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'public'       => array( 'type' => 'boolean' ),
				'hierarchical' => array( 'type' => 'boolean' ),
				'has_archive'  => array( 'type' => 'boolean' ),
				'show_in_rest' => array( 'type' => 'boolean' ),
				// Caps payload size; well above any reasonable description.
				'description'  => array(
					'type'      => 'string',
					'maxLength' => 1000,
				),
				'supports'     => array(
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
						'enum' => self::get_allowed_supports(),
					),
					'uniqueItems' => true,
					'maxItems'    => 50,
				),
				'taxonomies'   => array(
					'type'        => 'array',
					'items'       => array(
						'type'    => 'string',
						// Matches the wp_taxonomies key length cap.
						'pattern' => '^[a-z0-9_-]{1,32}$',
					),
					'uniqueItems' => true,
					'maxItems'    => 50,
				),
				'labels'       => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => $label_props,
				),
			),
		);
	}

	/**
	 * Returns the JSON schema for a single record. Removes the raw `content`
	 * field from the standard posts schema and replaces it with the typed
	 * `config` object.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = parent::get_item_schema();
		unset( $schema['properties']['content'] );

		$schema['properties']['config'] = array_merge(
			self::get_config_schema(),
			array(
				'description' => __( 'Typed post type configuration.', 'gutenberg' ),
				'context'     => array( 'view', 'edit' ),
				'default'     => array(),
			)
		);

		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Adds the typed `config` object to the response.
	 *
	 * @param WP_Post         $item    Stored record.
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$data     = $response->get_data();

		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'config', $fields ) ) {
			$decoded = json_decode( (string) $item->post_content, true );
			$config  = ( JSON_ERROR_NONE === json_last_error() && is_array( $decoded ) )
				? $decoded
				: array();
			// Storage marker is server-only; never expose it to clients.
			unset( $config[ GUTENBERG_USER_POST_TYPE_CONFIG_MARKER ] );
			// Empty config must serialize as `{}` to match the schema's
			// `type: 'object'`. PHP encodes empty associative arrays as `[]`
			// in JSON, so cast empties to stdClass.
			$data['config'] = empty( $config ) ? new stdClass() : $config;
		}

		$response->set_data( $data );
		return $response;
	}

	/**
	 * Translates the typed `config` field on the request into the JSON blob
	 * that lives in `post_content`, and rejects writes whose slug collides or
	 * has the wrong shape. Structural sanitization is layered onto
	 * `wp_insert_post_data`; this method only encodes.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return stdClass|WP_Error
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared = parent::prepare_item_for_database( $request );
		if ( is_wp_error( $prepared ) ) {
			return $prepared;
		}

		$slug_check = $this->validate_slug( $prepared );
		if ( is_wp_error( $slug_check ) ) {
			return $slug_check;
		}

		// `config` is replaced atomically when the param is present (or on
		// create). Omitting it from a PUT/PATCH preserves the stored value;
		// there is no in-`config` partial-update support.
		if ( $request->has_param( 'config' ) || empty( $request['id'] ) ) {
			$config = is_array( $request['config'] ) ? $request['config'] : array();

			// `JSON_HEX_TAG | JSON_HEX_AMP` escape `<`, `>`, and `&` to their
			// `\u00XX` forms before `wp_insert_post()` is called, so when
			// kses runs first via `content_save_pre` it sees an inert string
			// and is a no-op. `JSON_UNESCAPED_SLASHES` keeps URL-like values
			// readable and round-trips cleanly through `wp_slash`/`wp_unslash`.
			// Empty object-shaped positions are cast to `stdClass` via
			// `normalize_config_for_encode()` so they serialize as `{}`,
			// matching the schema's `type: 'object'` declarations.
			$prepared->post_content = wp_json_encode(
				self::normalize_config_for_encode( $config ),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		return $prepared;
	}

	/**
	 * Prepares a config array for `wp_json_encode` so every empty
	 * object-shaped position serializes as `{}` rather than `[]`, matching
	 * the schema's `type: 'object'` declarations.
	 *
	 * Drives off `get_config_schema()` so new object-typed fields get the
	 * `[] → {}` cast automatically. The `$schema` param is internal —
	 * public callers pass just `$value`; recursion threads the
	 * sub-schema through.
	 *
	 * @param mixed      $value  Value to normalize.
	 * @param array|null $schema Schema fragment for `$value`. Defaults to the full config schema.
	 * @return mixed
	 */
	public static function normalize_config_for_encode( $value, $schema = null ) {
		$schema = $schema ?? self::get_config_schema();
		if ( 'object' !== $schema['type'] ) {
			return $value;
		}
		if ( ! is_array( $value ) || empty( $value ) ) {
			return new stdClass();
		}
		foreach ( $schema['properties'] as $key => $sub_schema ) {
			if ( array_key_exists( $key, $value ) ) {
				$value[ $key ] = self::normalize_config_for_encode( $value[ $key ], $sub_schema );
			}
		}
		return $value;
	}

	/**
	 * Validates the prepared post's `post_name` slug. Rejects:
	 *   - shapes outside `^[a-z0-9_-]{1,20}$`,
	 *   - slugs already taken by another `wp_user_post_type` post,
	 *   - slugs reserved by an existing registered post type (core/plugin).
	 *
	 * The Add/Edit modals do the same checks client-side for UX, but the
	 * server is the authoritative gate.
	 *
	 * @param stdClass $prepared Prepared post object.
	 * @return true|WP_Error
	 */
	private function validate_slug( $prepared ) {
		$slug       = isset( $prepared->post_name ) ? (string) $prepared->post_name : '';
		$editing_id = isset( $prepared->ID ) ? (int) $prepared->ID : 0;

		// PUT/PATCH without a `slug` param leaves `post_name` empty so WP
		// keeps the row's existing slug. Skip validation in that case.
		if ( '' === $slug && $editing_id > 0 ) {
			return true;
		}

		if ( ! preg_match( GUTENBERG_USER_POST_TYPE_SLUG_PATTERN, $slug ) ) {
			return new WP_Error(
				'gutenberg_user_post_type_slug_invalid',
				__( 'Post type keys must be 1–20 characters and may only contain lowercase letters, numbers, hyphens, and underscores.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Unchanged slug on an existing record — allow.
		if ( $editing_id > 0 ) {
			$existing = get_post( $editing_id );
			if ( $existing && $existing->post_name === $slug ) {
				return true;
			}
		}

		$other_posts = get_posts(
			array(
				'post_type'        => 'wp_user_post_type',
				'post_status'      => 'any',
				'name'             => $slug,
				'posts_per_page'   => 1,
				'no_found_rows'    => true,
				'suppress_filters' => true,
				'post__not_in'     => $editing_id > 0 ? array( $editing_id ) : array(),
			)
		);
		if ( ! empty( $other_posts ) ) {
			return new WP_Error(
				'gutenberg_user_post_type_slug_taken',
				__( 'Another user-defined post type already uses this key.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Our own register_post_type() step runs at init priority 20 and skips
		// colliding slugs, so a post_type_exists() hit here means a
		// non-user-post-type registration owns the slug.
		if ( post_type_exists( $slug ) ) {
			return new WP_Error(
				'gutenberg_user_post_type_slug_reserved',
				sprintf(
					/* translators: %s: post type slug */
					__( 'The post type key "%s" is reserved by an existing post type.', 'gutenberg' ),
					$slug
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}
}
