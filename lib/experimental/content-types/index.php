<?php
/**
 * Registers the private CPTs that store user-defined content types:
 *   - wp_user_taxonomy     (user-defined taxonomies)
 *
 * Each record holds the registration intent for one taxonomy. On `init`,
 * this file also reads each published record and calls
 * `register_taxonomy()` for it.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-wp-rest-user-taxonomies-controller-gutenberg.php';

/**
 * Post meta key that stores the post types attached to a user-defined
 * taxonomy. Stored as meta (rather than inside the `post_content` JSON
 * with the rest of the config) so listings can filter on it via
 * `meta_query`. Underscore-prefixed so it's treated as protected meta.
 * Surfaced in REST as the typed top-level `object_type` field.
 */
const GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY = '_wp_user_taxonomy_object_type';

/**
 * Registers the wp_user_taxonomy CPT.
 */
function gutenberg_register_user_taxonomy_cpt() {
	register_post_type(
		'wp_user_taxonomy',
		array(
			'labels'                => array(
				'name'          => __( 'User taxonomies', 'gutenberg' ),
				'singular_name' => __( 'User taxonomy', 'gutenberg' ),
				'add_new_item'  => __( 'Add taxonomy', 'gutenberg' ),
			),
			'public'                => false,
			'publicly_queryable'    => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_rest'          => true,
			'rest_base'             => 'user-taxonomies',
			'rest_controller_class' => 'WP_REST_User_Taxonomies_Controller_Gutenberg',
			'capability_type'       => 'post',
			'capabilities'          => array(
				/**
				 * Capability map: every write operation requires `manage_options`.
				 * Read is allowed for any authenticated user that can `edit_posts` so the
				 * REST endpoint can be consumed by the Settings pages without exposing the
				 * records to unauthenticated visitors.
				 */
				'read'                   => 'edit_posts',
				'create_posts'           => 'manage_options',
				'edit_posts'             => 'manage_options',
				'edit_published_posts'   => 'manage_options',
				'delete_posts'           => 'manage_options',
				'delete_published_posts' => 'manage_options',
				'edit_others_posts'      => 'manage_options',
				'delete_others_posts'    => 'manage_options',
				'publish_posts'          => 'manage_options',
			),
			'map_meta_cap'          => true,
			'supports'              => array( 'title', 'editor' ),
			'hierarchical'          => false,
			'has_archive'           => false,
			'rewrite'               => false,
			'query_var'             => false,
		)
	);

	register_post_meta(
		'wp_user_taxonomy',
		GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY,
		array(
			// One row per attached post type, so `meta_query IN` can filter
			// listings by individual slug.
			'single'            => false,
			'type'              => 'string',
			// Surfaced via the REST controller as a top-level `object_type` array.
			// Setting `show_in_rest => false` keeps the raw meta key out of the
			// REST response so clients only see the typed field.
			'show_in_rest'      => false,
			'sanitize_callback' => 'sanitize_key',
			'auth_callback'     => static function () {
				return current_user_can( 'manage_options' );
			},
		)
	);
}

add_action( 'init', 'gutenberg_register_user_taxonomy_cpt' );

/**
 * Allowed keys inside the stored taxonomy config. Anything outside this list
 * is dropped by the sanitizer — this is the structural allowlist that backs
 * `additionalProperties: false` in the REST schema.
 *
 * @return string[]
 */
function gutenberg_user_taxonomy_allowed_label_keys() {
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
 * Sanitizes a decoded taxonomy config to the canonical allowlisted shape.
 * Called from {@see gutenberg_filter_user_taxonomy_post_content} on
 * `wp_insert_post_data` — the single sanitization site for taxonomy records.
 *
 * Unknown keys are dropped, label values are HTML-stripped via
 * `sanitize_text_field`, and empty values are omitted so callers can
 * distinguish "not set" from "set to empty".
 *
 * @param array $config Raw decoded config.
 * @return array Sanitized config.
 */
function gutenberg_user_taxonomy_sanitize_config( $config ) {
	if ( ! is_array( $config ) ) {
		return array();
	}

	$clean = array();

	if ( isset( $config['labels'] ) && is_array( $config['labels'] ) ) {
		$labels = array();
		foreach ( gutenberg_user_taxonomy_allowed_label_keys() as $key ) {
			if ( ! isset( $config['labels'][ $key ] ) || ! is_string( $config['labels'][ $key ] ) ) {
				continue;
			}
			$value = sanitize_text_field( $config['labels'][ $key ] );
			if ( '' !== $value ) {
				$labels[ $key ] = $value;
			}
		}
		if ( ! empty( $labels ) ) {
			$clean['labels'] = $labels;
		}
	}

	if ( isset( $config['public'] ) ) {
		$clean['public'] = (bool) $config['public'];
	}

	if ( isset( $config['hierarchical'] ) ) {
		$clean['hierarchical'] = (bool) $config['hierarchical'];
	}

	if ( isset( $config['description'] ) && is_string( $config['description'] ) ) {
		$description = sanitize_textarea_field( $config['description'] );
		if ( '' !== $description ) {
			$clean['description'] = $description;
		}
	}

	return $clean;
}

/**
 * Sanitizes wp_user_taxonomy JSON `post_content` during `wp_insert_post`.
 *
 * Acts on:
 *   - posts of type `wp_user_taxonomy`
 *   - revisions whose parent is a `wp_user_taxonomy` post
 *
 * Returns input unchanged for any other post type or for invalid JSON.
 * The filter is unconditional — taxonomy config isn't HTML and shouldn't
 * carry scripts even for users with `unfiltered_html`.
 *
 * Storage is encoded with `JSON_HEX_TAG | JSON_HEX_AMP`, so the bytes that
 * reach kses are inert and ordering vs `wp_filter_post_kses` is irrelevant.
 *
 * @param array $data Slashed post data being inserted/updated.
 * @return array Filtered data.
 */
function gutenberg_filter_user_taxonomy_post_content( $data ) {
	if ( ! isset( $data['post_type'], $data['post_content'] ) ) {
		return $data;
	}

	$is_taxonomy          = 'wp_user_taxonomy' === $data['post_type'];
	$is_taxonomy_revision = 'revision' === $data['post_type']
		&& ! empty( $data['post_parent'] )
		&& 'wp_user_taxonomy' === get_post_type( $data['post_parent'] );

	if ( ! $is_taxonomy && ! $is_taxonomy_revision ) {
		return $data;
	}

	$decoded = json_decode( wp_unslash( (string) $data['post_content'] ), true );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		return $data;
	}

	$clean = gutenberg_user_taxonomy_sanitize_config( $decoded );

	$data['post_content'] = wp_slash(
		wp_json_encode(
			$clean,
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		)
	);

	return $data;
}
add_filter( 'wp_insert_post_data', 'gutenberg_filter_user_taxonomy_post_content' );

/**
 * Reads the stored object_type meta values for a record, filtering down to
 * post types that currently exist.
 *
 * @param int $post_id Record ID.
 * @return string[]
 */
function gutenberg_user_taxonomy_read_object_type( $post_id ) {
	$values = get_post_meta( $post_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY );
	if ( ! is_array( $values ) ) {
		return array();
	}
	$out = array();
	foreach ( $values as $value ) {
		if ( is_string( $value ) && post_type_exists( $value ) ) {
			$out[] = $value;
		}
	}
	return array_values( array_unique( $out ) );
}

/**
 * Builds register_taxonomy() arguments from a wp_user_taxonomy record.
 * Returns null for invalid records so callers can skip them uniformly.
 *
 * @param WP_Post $record Stored taxonomy record.
 * @return array{0: string, 1: string[], 2: array}|null [ $slug, $object_type, $args ].
 */
function gutenberg_build_user_taxonomy_args( WP_Post $record ) {
	$slug = $record->post_name;
	if ( ! is_string( $slug ) || ! preg_match( '/^[a-z0-9_-]{1,32}$/', $slug ) ) {
		return null;
	}

	$decoded = json_decode( (string) $record->post_content, true, 8 );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		return null;
	}
	// Storage is sanitized at write-time by the filter on
	// `wp_insert_post_data`, so we trust the decoded shape here.
	$config = $decoded;

	$object_type = gutenberg_user_taxonomy_read_object_type( $record->ID );

	$title    = sanitize_text_field( $record->post_title );
	$singular = isset( $config['labels']['singular_name'] )
		? (string) $config['labels']['singular_name']
		: '';
	$labels   = array(
		'name'          => $title,
		'singular_name' => '' !== $singular ? $singular : $title,
	);

	// Merge optional label overrides. Empty strings fall through to the
	// WordPress-generated defaults, so we skip any label whose stored value
	// is empty after sanitization.
	$optional_label_keys = array_diff(
		gutenberg_user_taxonomy_allowed_label_keys(),
		array( 'singular_name' )
	);
	foreach ( $optional_label_keys as $label_key ) {
		if ( ! empty( $config['labels'][ $label_key ] ) ) {
			$labels[ $label_key ] = (string) $config['labels'][ $label_key ];
		}
	}

	$args = array(
		'labels'       => $labels,
		'public'       => ! empty( $config['public'] ),
		'hierarchical' => ! empty( $config['hierarchical'] ),
		'show_in_rest' => true,
	);

	if ( ! empty( $config['description'] ) ) {
		$args['description'] = (string) $config['description'];
	}

	return array( $slug, $object_type, $args );
}

/**
 * Reads each published wp_user_taxonomy record and calls register_taxonomy()
 * with a tightly-validated subset of its stored config.
 *
 * Drafts (post_status != 'publish') are skipped, so Edit's Active toggle
 * gates whether a record is actually registered.
 */
function gutenberg_register_user_defined_taxonomies() {
	$records = get_posts(
		array(
			'post_type'        => 'wp_user_taxonomy',
			'post_status'      => 'publish',
			'posts_per_page'   => -1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
		)
	);

	foreach ( $records as $record ) {
		$built = gutenberg_build_user_taxonomy_args( $record );
		if ( null === $built ) {
			continue;
		}
		list( $slug, $object_type, $args ) = $built;

		// Defense-in-depth: never overwrite an existing taxonomy registration,
		// even if a bad record slipped past server-side slug validation.
		if ( taxonomy_exists( $slug ) ) {
			continue;
		}

		register_taxonomy( $slug, $object_type, $args );
	}
}
add_action( 'init', 'gutenberg_register_user_defined_taxonomies', 20 );

/**
 * Rejects a wp_user_taxonomy save when its slug collides with an existing
 * registered taxonomy or another wp_user_taxonomy post. Primary server-side
 * defense — the Add/Edit modals do the same check client-side for UX, but
 * the server enforces the invariant.
 *
 * @param stdClass $prepared_post Post object prepared for insertion.
 * @return stdClass|WP_Error Filtered post object, or WP_Error to abort.
 */
function gutenberg_validate_user_taxonomy_slug( $prepared_post ) {
	$slug = ! empty( $prepared_post->post_name )
		? (string) $prepared_post->post_name
		: '';
	if ( '' === $slug ) {
		return $prepared_post;
	}

	$editing_id = isset( $prepared_post->ID ) ? (int) $prepared_post->ID : 0;

	// Unchanged slug on an existing record — allow.
	if ( $editing_id > 0 ) {
		$existing = get_post( $editing_id );
		if ( $existing && $existing->post_name === $slug ) {
			return $prepared_post;
		}
	}

	// Another wp_user_taxonomy post already owns this slug → reject.
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

	// Registered taxonomy owns this slug (core / plugin) → reject. Our own
	// `register_taxonomy()` step runs at init priority 20 and skips colliding
	// slugs, so a taxonomy_exists() hit here means a non-user-taxonomy
	// registration.
	if ( taxonomy_exists( $slug ) ) {
		return new WP_Error(
			'gutenberg_user_taxonomy_slug_reserved',
			sprintf(
				/* translators: %s: taxonomy slug */
				__( 'The taxonomy key "%s" is reserved by an existing taxonomy.', 'gutenberg' ),
				$slug
			),
			array( 'status' => 400 )
		);
	}

	return $prepared_post;
}
add_filter( 'rest_pre_insert_wp_user_taxonomy', 'gutenberg_validate_user_taxonomy_slug' );

/**
 * Persists the `object_type` array sent over REST as repeated meta rows.
 * Runs after the post is inserted/updated so the post ID is known and
 * permissions have already been checked by the controller.
 *
 * @param WP_Post         $post    Saved post.
 * @param WP_REST_Request $request REST request.
 */
function gutenberg_save_user_taxonomy_object_type( $post, $request ) {
	if ( ! ( $post instanceof WP_Post ) || ! ( $request instanceof WP_REST_Request ) ) {
		return;
	}
	if ( ! $request->has_param( 'object_type' ) ) {
		return;
	}

	$incoming = (array) $request['object_type'];
	$values   = array();
	foreach ( $incoming as $slug ) {
		if ( ! is_string( $slug ) ) {
			continue;
		}
		$clean = sanitize_key( $slug );
		if ( '' !== $clean && post_type_exists( $clean ) ) {
			$values[] = $clean;
		}
	}
	$values = array_values( array_unique( $values ) );

	delete_post_meta( $post->ID, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY );
	foreach ( $values as $slug ) {
		add_post_meta( $post->ID, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY, $slug );
	}
}
add_action( 'rest_after_insert_wp_user_taxonomy', 'gutenberg_save_user_taxonomy_object_type', 10, 2 );
