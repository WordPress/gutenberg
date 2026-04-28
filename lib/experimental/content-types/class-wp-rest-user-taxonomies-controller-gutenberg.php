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
 * Base User Taxonomies REST API Controller.
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
			$label_props[ $key ] = array( 'type' => 'string' );
		}
		return array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'public'       => array( 'type' => 'boolean' ),
				'hierarchical' => array( 'type' => 'boolean' ),
				'description'  => array( 'type' => 'string' ),
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
			// Empty config must serialize as `{}` to match the schema's
			// `type: 'object'`. PHP encodes empty associative arrays as `[]`
			// in JSON, so cast empties to stdClass.
			$data['config'] = empty( $config ) ? new stdClass() : $config;
		}

		if ( rest_is_field_included( 'object_type', $fields ) ) {
			$data['object_type'] = gutenberg_user_taxonomy_read_object_type( $item->ID );
		}

		$response->set_data( $data );
		return $response;
	}

	/**
	 * Translates the typed `config` field on the request into the JSON blob
	 * that lives in `post_content`, and rejects writes whose slug collides or
	 * has the wrong shape.
	 *
	 * The encode here is as-is — the sanitizer hooked to `wp_insert_post_data`
	 * does the structural sanitize in flight before the row is written.
	 *
	 * `JSON_HEX_TAG | JSON_HEX_AMP` escape `<`, `>`, and `&` to their `\u00XX`
	 * forms in the stored bytes, so when `wp_filter_post_kses` runs later on
	 * `content_save_pre` it sees an inert string with nothing to mangle. This
	 * is what makes ordering vs. kses irrelevant. `JSON_UNESCAPED_SLASHES`
	 * keeps URL-like values readable and round-trips cleanly through
	 * `wp_slash`/`wp_unslash`. `JSON_FORCE_OBJECT` keeps empty/nested object
	 * positions encoded as `{}` instead of `[]`, matching the schema's
	 * `type: 'object'` declarations.
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

		if ( $request->has_param( 'config' ) || empty( $request['id'] ) ) {
			$config                 = is_array( $request['config'] ?? null ) ? $request['config'] : array();
			$prepared->post_content = wp_json_encode(
				$config,
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_FORCE_OBJECT
			);
		}

		return $prepared;
	}

	/**
	 * Validates the prepared post's `post_name` slug. Rejects:
	 *   - shapes outside `^[a-z0-9_-]{1,32}$` (matches the regex used by
	 *     `gutenberg_build_user_taxonomy_args` — without this check, an
	 *     overlong/malformed slug gets stored but silently skipped at
	 *     `register_taxonomy()` time),
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
		$slug = ! empty( $prepared->post_name ) ? (string) $prepared->post_name : '';
		if ( '' === $slug ) {
			return true;
		}

		if ( ! preg_match( '/^[a-z0-9_-]{1,32}$/', $slug ) ) {
			return new WP_Error(
				'gutenberg_user_taxonomy_slug_invalid',
				__( 'Taxonomy keys must be 1–32 characters and may only contain lowercase letters, numbers, hyphens, and underscores.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$editing_id = isset( $prepared->ID ) ? (int) $prepared->ID : 0;

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
		if ( ! $request->has_param( 'object_type' ) ) {
			return $response;
		}

		$data    = $response->get_data();
		$post_id = (int) $data['id'];

		$this->save_object_type_meta( $post_id, $request );

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
		$response = parent::update_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( ! $request->has_param( 'object_type' ) ) {
			return $response;
		}

		$post_id = (int) $request['id'];

		$this->save_object_type_meta( $post_id, $request );

		$refreshed = $this->prepare_item_for_response( get_post( $post_id ), $request );
		if ( ! is_wp_error( $refreshed ) ) {
			$response->set_data( $refreshed->get_data() );
		}

		return $response;
	}

	/**
	 * Persists the `object_type` array from the request as repeated rows of
	 * `_wp_user_taxonomy_object_type` post meta. Stored separately from the
	 * JSON config so listings can filter via `meta_query` IN. Callers must
	 * have already verified that the request includes the `object_type`
	 * param.
	 *
	 * @param int             $post_id Saved post ID.
	 * @param WP_REST_Request $request REST request.
	 */
	private function save_object_type_meta( $post_id, $request ) {
		$values = array();
		foreach ( (array) $request['object_type'] as $slug ) {
			if ( ! is_string( $slug ) ) {
				continue;
			}
			$clean = sanitize_key( $slug );
			if ( '' !== $clean && post_type_exists( $clean ) ) {
				$values[] = $clean;
			}
		}
		$values = array_values( array_unique( $values ) );

		delete_post_meta( $post_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY );
		foreach ( $values as $slug ) {
			add_post_meta( $post_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY, $slug );
		}
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
				$meta_query   = isset( $query_args['meta_query'] ) && is_array( $query_args['meta_query'] )
					? $query_args['meta_query']
					: array();
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
