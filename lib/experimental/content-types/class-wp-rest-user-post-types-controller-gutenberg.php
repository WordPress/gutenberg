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
				// Storage split: the JSON blob in `post_content` holds only
				// non-user-defined slugs (core/theme/plugin). Slugs that
				// match a `wp_user_taxonomy` record live on the taxonomy
				// side via `_wp_user_taxonomy_object_type` meta. Requests
				// and responses carry the union; `prepare_item_for_database`
				// and `prepare_item_for_response` reconcile the two sides.
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

		$schema['properties']['count'] = array(
			'description' => __( 'Number of posts of this post type, matching the count shown in the admin list table\'s "All" view.', 'gutenberg' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
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

			// `config.taxonomies` in the response is the merged view: the
			// non-user slugs persisted in this record's JSON, plus any
			// user-defined taxonomies whose `_wp_user_taxonomy_object_type`
			// meta points back at this post type. Single field for the
			// client to read and write — the controller splits writes back
			// into the two storage sites.
			$stored = isset( $config['taxonomies'] ) && is_array( $config['taxonomies'] )
				? array_values( array_filter( $config['taxonomies'], 'is_string' ) )
				: array();
			$linked = array();
			foreach ( self::get_user_taxonomy_ids_with_meta( $item->post_name ) as $tax_id ) {
				$tax_slug = (string) get_post_field( 'post_name', $tax_id );
				if ( '' !== $tax_slug ) {
					$linked[] = $tax_slug;
				}
			}
			$merged = array_values( array_unique( array_merge( $stored, $linked ) ) );
			if ( ! empty( $merged ) ) {
				$config['taxonomies'] = $merged;
			} else {
				unset( $config['taxonomies'] );
			}

			// Empty config must serialize as `{}` to match the schema's
			// `type: 'object'`. PHP encodes empty associative arrays as `[]`
			// in JSON, so cast empties to stdClass.
			$data['config'] = empty( $config ) ? new stdClass() : $config;
		}

		if ( rest_is_field_included( 'count', $fields ) && 'publish' === $item->post_status ) {
			$num_posts = wp_count_posts( $item->post_name, 'readable' );
			$total     = array_sum( (array) $num_posts );
			foreach ( get_post_stati( array( 'show_in_admin_all_list' => false ) ) as $state ) {
				$total -= isset( $num_posts->$state ) ? (int) $num_posts->$state : 0;
			}
			$data['count'] = $total;
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

			// User-defined taxonomy slugs ride on the taxonomy record's
			// `_wp_user_taxonomy_object_type` meta as the single source of
			// truth, so they're stripped from `config.taxonomies` here and
			// reapplied via `sync_taxonomy_associations()` after save. The
			// JSON keeps only core/theme/plugin slugs.
			if ( isset( $config['taxonomies'] ) && is_array( $config['taxonomies'] ) ) {
				$ids_by_slug = self::get_user_taxonomy_ids_by_slug();
				$stored      = array();
				foreach ( $config['taxonomies'] as $slug ) {
					if ( is_string( $slug ) && ! isset( $ids_by_slug[ $slug ] ) ) {
						$stored[] = $slug;
					}
				}
				$config['taxonomies'] = array_values( array_unique( $stored ) );
			}

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
	 * Creates a record, then mirrors any `config.taxonomies` user-tax slugs
	 * into the corresponding wp_user_taxonomy records' `object_type` meta.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$response = parent::create_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$data    = $response->get_data();
		$post_id = (int) $data['id'];
		$this->sync_taxonomy_associations( $post_id, $request );

		// A new record published in this request will register on the next
		// `init`, so the rewrite rules need to follow.
		if ( 'publish' === get_post_status( $post_id ) ) {
			gutenberg_user_content_types_schedule_flush_rewrite_rules();
		}

		$post = get_post( $post_id );
		if ( $post instanceof WP_Post ) {
			$refreshed = $this->prepare_item_for_response( $post, $request );
			if ( ! is_wp_error( $refreshed ) ) {
				$response->set_data( $refreshed->get_data() );
			}
		}
		return $response;
	}

	/**
	 * Updates a record, migrates user-taxonomy back-references when the slug
	 * changes, and re-syncs taxonomy associations from `config.taxonomies`.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$post_id         = (int) $request['id'];
		$existing        = get_post( $post_id );
		$previous_slug   = $existing instanceof WP_Post ? (string) $existing->post_name : '';
		$previous_status = $existing instanceof WP_Post ? (string) $existing->post_status : '';
		$previous_config = $existing instanceof WP_Post
			? self::decode_stored_config( $existing->post_content )
			: array();

		$response = parent::update_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$current_slug = (string) get_post_field( 'post_name', $post_id );
		if ( '' !== $previous_slug && '' !== $current_slug && $previous_slug !== $current_slug ) {
			self::migrate_user_tax_back_references( $previous_slug, $current_slug );
		}
		$this->sync_taxonomy_associations( $post_id, $request );

		$post = get_post( $post_id );
		if ( $post instanceof WP_Post && self::update_needs_rewrite_flush( $previous_status, $previous_slug, $previous_config, $post ) ) {
			gutenberg_user_content_types_schedule_flush_rewrite_rules();
		}

		if ( $post instanceof WP_Post ) {
			$refreshed = $this->prepare_item_for_response( $post, $request );
			if ( ! is_wp_error( $refreshed ) ) {
				$response->set_data( $refreshed->get_data() );
			}
		}
		return $response;
	}

	/**
	 * Force-deletes a record after stripping its slug from any user-taxonomy
	 * `_wp_user_taxonomy_object_type` meta that referenced it. Trash (force
	 * = false) leaves the meta intact so untrashing restores the linkage.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		// Capture the slug and pre-delete status before the parent runs —
		// once force-delete fires the post is gone and `post_name` /
		// `post_status` are no longer reachable, and trash will have already
		// transitioned the row's status by the time we read it back.
		$force          = ! empty( $request['force'] );
		$existing       = get_post( (int) $request['id'] );
		$slug           = ( $force && $existing instanceof WP_Post ) ? (string) $existing->post_name : '';
		$was_registered = $existing instanceof WP_Post && 'publish' === $existing->post_status;
		$response       = parent::delete_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( $force && '' !== $slug ) {
			foreach ( self::get_user_taxonomy_ids_with_meta( $slug ) as $tax_id ) {
				gutenberg_user_taxonomy_detach_object_type( $tax_id, $slug );
			}
		}
		// Either trash (publish → trash) or force-delete on a previously
		// published record removes it from the next `init`'s registration,
		// so the rewrite rules need to follow. Drafts were never registered;
		// nothing to flush.
		if ( $was_registered ) {
			gutenberg_user_content_types_schedule_flush_rewrite_rules();
		}
		return $response;
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

	/**
	 * Reapplies the user-taxonomy half of a `config.taxonomies` write. Walks
	 * the requested slugs once, finds the user-defined ones, and reconciles
	 * each affected wp_user_taxonomy record's `_wp_user_taxonomy_object_type`
	 * meta to match. Slugs in the request that already exist in meta are
	 * left alone; previously-attached user taxonomies that are no longer in
	 * the request have the post type slug removed from their meta.
	 *
	 * Skipped when the request omits `config.taxonomies`.
	 *
	 * @param int             $post_id Saved post ID.
	 * @param WP_REST_Request $request REST request.
	 */
	private function sync_taxonomy_associations( $post_id, $request ) {
		if ( ! $request->has_param( 'config' ) ) {
			return;
		}
		$config = $request['config'];
		if ( ! is_array( $config ) || ! isset( $config['taxonomies'] ) || ! is_array( $config['taxonomies'] ) ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return;
		}
		$current_slug = (string) $post->post_name;

		$ids_by_slug = self::get_user_taxonomy_ids_by_slug();
		$desired     = array();
		foreach ( $config['taxonomies'] as $slug ) {
			if ( is_string( $slug ) && isset( $ids_by_slug[ $slug ] ) ) {
				$desired[ $slug ] = true;
			}
		}

		// Walk previously-attached user taxonomies; detach the post-type
		// slug from any whose taxonomy isn't in the new request, mark the
		// rest as already-applied so we don't re-attach them below.
		foreach ( self::get_user_taxonomy_ids_with_meta( $current_slug ) as $tax_id ) {
			$tax_slug = get_post_field( 'post_name', $tax_id );
			if ( ! is_string( $tax_slug ) || '' === $tax_slug ) {
				continue;
			}
			if ( isset( $desired[ $tax_slug ] ) ) {
				unset( $desired[ $tax_slug ] );
			} else {
				gutenberg_user_taxonomy_detach_object_type( $tax_id, $current_slug );
			}
		}

		// Anything left in $desired is a newly-requested attachment.
		foreach ( array_keys( $desired ) as $tax_slug ) {
			gutenberg_user_taxonomy_attach_object_type( $ids_by_slug[ $tax_slug ], $current_slug );
		}
	}

	/**
	 * Rewrites every `_wp_user_taxonomy_object_type` meta row pointing at
	 * `$previous_slug` to `$current_slug`. Called from {@see update_item}
	 * whenever the slug changes, independently of `config.taxonomies` —
	 * a PUT that only renames the slug still needs the back-references
	 * to follow, otherwise every linked user taxonomy silently disconnects.
	 *
	 * @param string $previous_slug Slug the record had before this save.
	 * @param string $current_slug  Slug after the save.
	 */
	private static function migrate_user_tax_back_references( $previous_slug, $current_slug ) {
		foreach ( self::get_user_taxonomy_ids_with_meta( $previous_slug ) as $tax_id ) {
			gutenberg_user_taxonomy_detach_object_type( $tax_id, $previous_slug );
			gutenberg_user_taxonomy_attach_object_type( $tax_id, $current_slug );
		}
	}

	/**
	 * Decides whether an `update_item` mutation needs the rewrite rules
	 * regenerated. Triggers on:
	 *   - status crossing the `publish` boundary in either direction (a
	 *     record going from active → inactive or back, which toggles
	 *     `register_post_type()` on next `init`),
	 *   - while remaining published, a change in slug, `has_archive`,
	 *     `public`, or `hierarchical`. `hierarchical` flips the rewrite
	 *     tag regex between `(.+?)` (nested) and `([^/]+)` (flat) and
	 *     swaps the query-var fallback between `pagename=` and `name=`.
	 *
	 * Other config edits (labels, supports, taxonomies, description,
	 * show_in_rest) don't affect rewrite rules and are skipped so we
	 * don't flush on every label tweak.
	 *
	 * @param string  $previous_status Status the record had before update.
	 * @param string  $previous_slug   Slug before update.
	 * @param array   $previous_config Decoded config before update.
	 * @param WP_Post $current_post    Record after update.
	 * @return bool
	 */
	private static function update_needs_rewrite_flush( $previous_status, $previous_slug, $previous_config, WP_Post $current_post ) {
		$current_status = (string) $current_post->post_status;
		$was_active     = 'publish' === $previous_status;
		$is_active      = 'publish' === $current_status;

		if ( $was_active !== $is_active ) {
			return true;
		}
		if ( ! $is_active ) {
			// Drafts aren't registered, so config edits between drafts are
			// irrelevant to rewrite rules.
			return false;
		}

		if ( $previous_slug !== (string) $current_post->post_name ) {
			return true;
		}

		$current_config = self::decode_stored_config( $current_post->post_content );
		if ( ! empty( $previous_config['has_archive'] ) !== ! empty( $current_config['has_archive'] ) ) {
			return true;
		}
		if ( ! empty( $previous_config['public'] ) !== ! empty( $current_config['public'] ) ) {
			return true;
		}
		if ( ! empty( $previous_config['hierarchical'] ) !== ! empty( $current_config['hierarchical'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Decodes the stored `post_content` JSON for a wp_user_post_type record
	 * down to its sanitized config array. Returns an empty array on invalid
	 * JSON so callers can use `! empty()` semantics for boolean fields.
	 *
	 * @param string $post_content Raw stored JSON.
	 * @return array
	 */
	private static function decode_stored_config( $post_content ) {
		$decoded = json_decode( (string) $post_content, true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
			return array();
		}
		unset( $decoded[ GUTENBERG_USER_POST_TYPE_CONFIG_MARKER ] );
		return $decoded;
	}

	/**
	 * Returns a `slug => ID` map of every wp_user_taxonomy record. Used both
	 * as the user-tax membership check (`isset( $map[ $slug ] )`) and as the
	 * slug-to-ID lookup when reattaching `_wp_user_taxonomy_object_type`
	 * meta. Single bounded query; user taxonomies are a small set.
	 *
	 * @return array<string, int>
	 */
	private static function get_user_taxonomy_ids_by_slug() {
		$records = get_posts(
			array(
				'post_type'              => 'wp_user_taxonomy',
				'post_status'            => 'any',
				'posts_per_page'         => -1,
				'no_found_rows'          => true,
				'suppress_filters'       => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);
		$map     = array();
		foreach ( $records as $record ) {
			$slug = (string) $record->post_name;
			if ( '' !== $slug ) {
				$map[ $slug ] = (int) $record->ID;
			}
		}
		return $map;
	}

	/**
	 * Returns wp_user_taxonomy record IDs whose
	 * `_wp_user_taxonomy_object_type` meta contains the given post type
	 * slug, fetched directly from the DB.
	 *
	 * @param string $post_type_slug Post type slug to match.
	 * @return int[]
	 */
	private static function get_user_taxonomy_ids_with_meta( $post_type_slug ) {
		if ( '' === (string) $post_type_slug ) {
			return array();
		}
		return get_posts(
			array(
				'post_type'        => 'wp_user_taxonomy',
				'post_status'      => 'any',
				'posts_per_page'   => -1,
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => true,
				'meta_query'       => array(
					array(
						'key'     => GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY,
						'value'   => $post_type_slug,
						'compare' => '=',
					),
				),
			)
		);
	}
}
