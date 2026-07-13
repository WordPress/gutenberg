<?php
/**
 * REST API: WP_REST_User_Taxonomies_Controller_Gutenberg class
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( class_exists( 'WP_REST_User_Taxonomies_Controller_Gutenberg' ) ) {
	return;
}

/**
 * REST controller for user-defined taxonomies.
 *
 * Extends `WP_REST_Posts_Controller` because user taxonomies are stored
 * as posts of the private `wp_user_taxonomy` CPT, not as WP terms — each
 * record is the registration intent for a taxonomy, registered on `init`
 * by `gutenberg_register_user_defined_taxonomies()`.
 */
class WP_REST_User_Taxonomies_Controller_Gutenberg extends WP_REST_Posts_Controller {

	/**
	 * Allowed keys inside the stored `config.labels` object. Anything outside
	 * this list is dropped at sanitization time via the schema's
	 * `additionalProperties: false`. The client mirrors this in
	 * `STRING_LABEL_KEYS` (packages/user-taxonomies/src/utils.ts) — drift is
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
			'edit_item',
			'view_item',
			'update_item',
			'add_new_item',
			'new_item_name',
			'search_items',
			'not_found',
			'back_to_items',
			'parent_item',
			'popular_items',
			'separate_items_with_commas',
			'parent_item_colon',
			'add_or_remove_items',
			'choose_from_most_used',
		);
	}

	/**
	 * Returns the typed schema for the `config` blob stored in `post_content`.
	 * Single source of truth on the server: `get_item_schema()` embeds it as
	 * the REST `config` property, and `gutenberg_user_taxonomy_sanitize_config`
	 * feeds it to `rest_sanitize_value_from_schema()` at write time.
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
				'public'             => array( 'type' => 'boolean' ),
				'hierarchical'       => array( 'type' => 'boolean' ),
				// Caps payload size; well above any reasonable description.
				'description'        => array(
					'type'      => 'string',
					'maxLength' => 1000,
				),
				'publicly_queryable' => array( 'type' => 'boolean' ),
				'show_ui'            => array( 'type' => 'boolean' ),
				'show_in_menu'       => array( 'type' => 'boolean' ),
				'show_in_nav_menus'  => array( 'type' => 'boolean' ),
				'show_tagcloud'      => array( 'type' => 'boolean' ),
				'show_in_quick_edit' => array( 'type' => 'boolean' ),
				'show_admin_column'  => array( 'type' => 'boolean' ),
				'show_in_rest'       => array( 'type' => 'boolean' ),
				'sort'               => array( 'type' => 'boolean' ),
				'default_term'       => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'name' => array(
							'type'      => 'string',
							// Matches the `wp_terms.name` column (varchar(200)).
							'maxLength' => 200,
						),
					),
				),
				'labels'             => array(
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
	 * `config` object plus the top-level `object_type` array.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = parent::get_item_schema();
		unset( $schema['properties']['content'] );

		$schema['properties']['object_type'] = array(
			'description' => __( 'Post types attached to this taxonomy.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type'    => 'string',
				// Matches the wp_posts.post_type column width.
				'pattern' => '^[a-z0-9_-]{1,20}$',
			),
			'uniqueItems' => true,
			// Bounds the meta_query IN list; far above any realistic count.
			'maxItems'    => 50,
			'context'     => array( 'view', 'edit' ),
			'default'     => array(),
		);

		$schema['properties']['config'] = array_merge(
			self::get_config_schema(),
			array(
				'description' => __( 'Typed taxonomy configuration.', 'gutenberg' ),
				'context'     => array( 'view', 'edit' ),
				'default'     => array(),
			)
		);

		$schema['properties']['count'] = array(
			'description' => __( 'Number of terms in this taxonomy.', 'gutenberg' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
		);

		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Adds the typed `config` object and `object_type` array to the response.
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
			unset( $config[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] );
			// Empty config must serialize as `{}` to match the schema's
			// `type: 'object'`. PHP encodes empty associative arrays as `[]`
			// in JSON, so cast empties to stdClass.
			$data['config'] = empty( $config ) ? new stdClass() : $config;
		}

		if ( rest_is_field_included( 'object_type', $fields ) ) {
			$data['object_type'] = gutenberg_user_taxonomy_read_object_type( $item->ID );
		}

		if ( rest_is_field_included( 'count', $fields ) && 'publish' === $item->post_status ) {
			// Drafts aren't registered, so the count is undefined — omit the
			// field rather than report a value the server can't vouch for.
			$count         = wp_count_terms(
				array(
					'taxonomy'   => $item->post_name,
					'hide_empty' => false,
				)
			);
			$data['count'] = is_wp_error( $count ) ? 0 : (int) $count;
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
	 * Drives off `get_config_schema()` so new object-typed fields
	 * (e.g. `capabilities`, `rewrite`, `default_term`) get the
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
	 *   - shapes outside `^[a-z0-9_-]{1,32}$`,
	 *   - slugs already taken by another `wp_user_taxonomy` post,
	 *   - slugs reserved by an existing registered taxonomy (core/plugin).
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

		if ( ! preg_match( GUTENBERG_USER_TAXONOMY_SLUG_PATTERN, $slug ) ) {
			return new WP_Error(
				'gutenberg_user_taxonomy_slug_invalid',
				__( 'Taxonomy keys must be 1–32 characters and may only contain lowercase letters, numbers, hyphens, and underscores.', 'gutenberg' ),
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
				'post_type'        => 'wp_user_taxonomy',
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
				'gutenberg_user_taxonomy_slug_taken',
				__( 'Another user-defined taxonomy already uses this key.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Our own register_taxonomy() step runs at init priority 20 and skips
		// colliding slugs, so a taxonomy_exists() hit here means a
		// non-user-taxonomy registration owns the slug.
		if ( taxonomy_exists( $slug ) ) {
			return new WP_Error(
				'gutenberg_user_taxonomy_slug_reserved',
				sprintf(
					/* translators: %s: taxonomy slug */
					__( 'The taxonomy key "%s" is already in use by a built-in or plugin-registered taxonomy.', 'gutenberg' ),
					$slug
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Creates a single record, then writes the `object_type` post meta from
	 * the request and re-prepares the response so the just-written meta is
	 * reflected in the response body. Mirrors the re-prepare pattern used by
	 * `WP_REST_Attachments_Controller::create_item`.
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

		// A new record published in this request will register on the next
		// `init`, so the rewrite rules need to follow.
		if ( 'publish' === get_post_status( $post_id ) ) {
			gutenberg_user_content_types_schedule_flush_rewrite_rules();
		}

		if ( ! $request->has_param( 'object_type' ) ) {
			return $response;
		}

		gutenberg_user_taxonomy_replace_object_types( $post_id, (array) $request['object_type'] );

		$refreshed = $this->prepare_item_for_response( get_post( $post_id ), $request );
		if ( ! is_wp_error( $refreshed ) ) {
			$response->set_data( $refreshed->get_data() );
		}

		return $response;
	}

	/**
	 * Updates a single record, then writes the `object_type` post meta from
	 * the request and re-prepares the response. Mirrors the pattern used by
	 * `WP_REST_Attachments_Controller::update_item`.
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

		$post = get_post( $post_id );
		if ( $post instanceof WP_Post && self::update_needs_rewrite_flush( $previous_status, $previous_slug, $previous_config, $post ) ) {
			gutenberg_user_content_types_schedule_flush_rewrite_rules();
		}

		if ( ! $request->has_param( 'object_type' ) ) {
			return $response;
		}

		gutenberg_user_taxonomy_replace_object_types( $post_id, (array) $request['object_type'] );

		$refreshed = $this->prepare_item_for_response( get_post( $post_id ), $request );
		if ( ! is_wp_error( $refreshed ) ) {
			$response->set_data( $refreshed->get_data() );
		}

		return $response;
	}

	/**
	 * Force-deletes or trashes a record. Mirrors the post-types side: when
	 * the record was registered (status was `publish`), the next `init`
	 * stops calling `register_taxonomy()` for it, and the rewrite rules
	 * need to follow. Trash leaves the row but transitions status, which
	 * the registration loop already filters on, so it's covered the same
	 * way as force-delete.
	 *
	 * Inheriting `WP_REST_Posts_Controller::delete_item()` for the actual
	 * removal — we only wrap to capture pre-delete state and schedule the
	 * deferred flush.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$existing       = get_post( (int) $request['id'] );
		$was_registered = $existing instanceof WP_Post && 'publish' === $existing->post_status;
		$response       = parent::delete_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( $was_registered ) {
			gutenberg_user_content_types_schedule_flush_rewrite_rules();
		}
		return $response;
	}

	/**
	 * Decides whether an `update_item` mutation needs the rewrite rules
	 * regenerated. Triggers on:
	 *   - status crossing the `publish` boundary in either direction
	 *     (registration toggles on next `init`),
	 *   - while remaining published, a change in slug, `public`, or
	 *     `publicly_queryable` — the fields that change the rewrite rules
	 *     `register_taxonomy()` emits. `publicly_queryable` flips
	 *     `query_var`, which in turn swaps the `add_rewrite_tag` query
	 *     string between `{slug}=` and `taxonomy={name}&term=`.
	 *
	 * Other config edits (labels, hierarchical, show_ui, show_in_rest, etc.)
	 * don't affect rewrite rules. `hierarchical` only changes the rewrite
	 * tag regex when paired with `rewrite['hierarchical'] = true`, which
	 * `gutenberg_build_user_taxonomy_args()` never sets — `rewrite` is
	 * left at its `true` default, so `rewrite['hierarchical']` parses to
	 * false.
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
			return false;
		}

		if ( $previous_slug !== (string) $current_post->post_name ) {
			return true;
		}

		$current_config = self::decode_stored_config( $current_post->post_content );
		if ( ! empty( $previous_config['public'] ) !== ! empty( $current_config['public'] ) ) {
			return true;
		}
		// `publicly_queryable` defaults to `public` when omitted from the
		// stored config, so compare effective values rather than raw flags
		// — otherwise toggling `publicly_queryable` between "absent (=public)"
		// and "explicitly equal to public" would trip a no-op flush.
		$prev_pq = array_key_exists( 'publicly_queryable', $previous_config )
			? ! empty( $previous_config['publicly_queryable'] )
			: ! empty( $previous_config['public'] );
		$curr_pq = array_key_exists( 'publicly_queryable', $current_config )
			? ! empty( $current_config['publicly_queryable'] )
			: ! empty( $current_config['public'] );
		if ( $prev_pq !== $curr_pq ) {
			return true;
		}

		return false;
	}

	/**
	 * Decodes the stored `post_content` JSON for a wp_user_taxonomy record
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
		unset( $decoded[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] );
		return $decoded;
	}

	/**
	 * Adds the `object_type` collection parameter so listings can be filtered
	 * down to taxonomies attached to one or more post types.
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();

		$params['object_type'] = array(
			'description' => __( 'Limit results to taxonomies attached to one or more of the given post types.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type'    => 'string',
				'pattern' => '^[a-z0-9_-]{1,20}$',
			),
			'uniqueItems' => true,
			'maxItems'    => 50,
			'default'     => array(),
		);

		return $params;
	}

	/**
	 * Translates the `object_type` collection param into a `meta_query`
	 * IN clause against the underlying post meta key.
	 *
	 * @param array           $prepared_args Optional. Prepared WP_Query args.
	 * @param WP_REST_Request $request       Optional. REST request.
	 * @return array
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args = parent::prepare_items_query( $prepared_args, $request );

		if ( $request instanceof WP_REST_Request && ! empty( $request['object_type'] ) ) {
			$values = array();
			foreach ( (array) $request['object_type'] as $slug ) {
				if ( is_string( $slug ) && '' !== $slug ) {
					$values[] = sanitize_key( $slug );
				}
			}
			$values = array_values( array_filter( array_unique( $values ) ) );

			if ( ! empty( $values ) ) {
				$meta_query = isset( $query_args['meta_query'] ) && is_array( $query_args['meta_query'] )
					? $query_args['meta_query']
					: array();
				// TODO(perf): one meta row per attached post type combined
				// with post/meta cache behavior at higher taxonomy counts
				// is worth profiling — see PR #77697 follow-up.
				$meta_query[] = array(
					'key'     => GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY,
					'value'   => $values,
					'compare' => 'IN',
				);

				$query_args['meta_query'] = $meta_query;
			}
		}

		return $query_args;
	}
}
