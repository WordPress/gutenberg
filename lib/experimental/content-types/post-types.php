<?php
/**
 * Registers the wp_user_post_type CPT that stores user-defined post types,
 * and materializes published records into live `register_post_type()` calls.
 *
 * Each record holds the registration intent for one post type. Drafts are
 * skipped at materialization time, so the Active toggle gates whether a
 * record is actually registered.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Self-identifying key embedded in stored `post_content` JSON. Mirrors
 * core's `isGlobalStylesUserThemeJSON` for `wp_global_styles`.
 *
 * Storage-only: kept out of the REST schema and stripped on read so it
 * never reaches clients. See the equivalent constant on the user-taxonomy
 * side for the full forward-compat rationale.
 */
const GUTENBERG_USER_POST_TYPE_CONFIG_MARKER = 'isUserPostTypeConfigJSON';

/**
 * Regex for a valid post type slug. 20 chars matches the `wp_posts.post_type`
 * column width that `register_post_type()` enforces.
 */
const GUTENBERG_USER_POST_TYPE_SLUG_PATTERN = '/^[a-z0-9_-]{1,20}$/';

/**
 * Registers the wp_user_post_type CPT.
 */
function gutenberg_register_user_post_type_cpt() {
	register_post_type(
		'wp_user_post_type',
		array(
			'labels'                => array(
				'name'          => __( 'User post types', 'gutenberg' ),
				'singular_name' => __( 'User post type', 'gutenberg' ),
				'add_new_item'  => __( 'Add post type', 'gutenberg' ),
			),
			'public'                => false,
			'publicly_queryable'    => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_rest'          => true,
			'rest_base'             => 'user-post-types',
			'rest_controller_class' => 'WP_REST_User_Post_Types_Controller_Gutenberg',
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
			'_builtin'              => true, /* internal use only. don't use this when registering your own post type. */
		)
	);
}

add_action( 'init', 'gutenberg_register_user_post_type_cpt' );

/**
 * Sanitizes a decoded post type config to the canonical shape declared by
 * the REST controller's config schema. Single sanitization site for
 * post type records — called from {@see gutenberg_filter_user_post_type_post_content}
 * on `wp_insert_post_data`.
 *
 * @param array $config Raw decoded config.
 * @return array Sanitized config.
 */
function gutenberg_user_post_type_sanitize_config( $config ) {
	if ( ! is_array( $config ) ) {
		return array();
	}

	$clean = rest_sanitize_value_from_schema(
		$config,
		WP_REST_User_Post_Types_Controller_Gutenberg::get_config_schema()
	);
	if ( ! is_array( $clean ) ) {
		return array();
	}

	// `rest_sanitize_value_from_schema()` casts strings to their declared
	// type but doesn't strip HTML or control characters, so layer that on.
	if ( isset( $clean['description'] ) ) {
		$clean['description'] = sanitize_textarea_field( (string) $clean['description'] );
	}
	if ( isset( $clean['labels'] ) && is_array( $clean['labels'] ) ) {
		foreach ( $clean['labels'] as $key => $value ) {
			$clean['labels'][ $key ] = sanitize_text_field( (string) $value );
		}
	}

	return $clean;
}

/**
 * Sanitizes wp_user_post_type JSON `post_content` during `wp_insert_post`.
 *
 * Acts on posts of type `wp_user_post_type`. Returns input unchanged for
 * any other post type. Invalid JSON is normalized to the canonical
 * marker-only payload rather than passed through. The filter is
 * unconditional — post type config isn't HTML and shouldn't carry scripts
 * even for users with `unfiltered_html`.
 *
 * @param array $data Slashed post data being inserted/updated.
 * @return array Filtered data.
 */
function gutenberg_filter_user_post_type_post_content( $data ) {
	if ( ! isset( $data['post_type'], $data['post_content'] ) ) {
		return $data;
	}

	if ( 'wp_user_post_type' !== $data['post_type'] ) {
		return $data;
	}

	$decoded = json_decode( wp_unslash( (string) $data['post_content'] ), true );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		// Hedge: invalid JSON falls through to a canonical empty payload so
		// a stray read path can't surface arbitrary bytes. The marker is
		// added below, keeping the stored shape uniform.
		$decoded = array();
	}

	$clean = gutenberg_user_post_type_sanitize_config( $decoded );

	// Storage-only marker: deliberately not in the REST schema so it can
	// never reach clients. Kept as a forward-compat anchor for a
	// content-only fallback sanitizer; full rationale on the const.
	$clean[ GUTENBERG_USER_POST_TYPE_CONFIG_MARKER ] = true;

	// `wp_insert_post_data` is the last filter before the row is written,
	// so the re-encode here is what lands in the database.
	// `JSON_HEX_TAG | JSON_HEX_AMP` guarantee the stored bytes carry no
	// live `<`, `>`, or `&`, so any subsequent pass through kses (on
	// later updates or on display) sees an inert string. kses on
	// `content_save_pre` already ran earlier in `wp_insert_post()`; for
	// REST writes that input was pre-escaped by
	// `prepare_item_for_database`, so that earlier pass was also a no-op.
	$data['post_content'] = wp_slash(
		wp_json_encode(
			WP_REST_User_Post_Types_Controller_Gutenberg::normalize_config_for_encode( $clean ),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		)
	);

	return $data;
}
add_filter( 'wp_insert_post_data', 'gutenberg_filter_user_post_type_post_content' );

/**
 * Builds register_post_type() arguments from a wp_user_post_type record.
 * Returns null for invalid records so callers can skip them uniformly.
 *
 * @param WP_Post $record Stored post type record.
 * @return array{0: string, 1: array}|null [ $slug, $args ].
 */
function gutenberg_build_user_post_type_args( WP_Post $record ) {
	$slug = $record->post_name;
	if ( ! is_string( $slug ) || ! preg_match( GUTENBERG_USER_POST_TYPE_SLUG_PATTERN, $slug ) ) {
		return null;
	}

	$decoded = json_decode( (string) $record->post_content, true, 8 );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		return null;
	}
	unset( $decoded[ GUTENBERG_USER_POST_TYPE_CONFIG_MARKER ] );
	// Storage is sanitized at write-time by the filter on
	// `wp_insert_post_data`, so we trust the decoded shape here.
	$config = $decoded;

	$title    = sanitize_text_field( $record->post_title );
	$singular = isset( $config['labels']['singular_name'] )
		? (string) $config['labels']['singular_name']
		: '';
	$labels   = array(
		'name'          => $title,
		'singular_name' => '' !== $singular ? $singular : $title,
	);

	// Merge optional label overrides. The sanitizer has already pruned
	// unknown keys against the schema, so we can trust whatever the stored
	// labels object contains. Empty strings fall through to the
	// WordPress-generated defaults.
	$stored_labels = isset( $config['labels'] ) && is_array( $config['labels'] )
		? $config['labels']
		: array();
	foreach ( array_keys( $stored_labels ) as $label_key ) {
		if ( 'singular_name' === $label_key ) {
			continue;
		}
		if ( ! empty( $stored_labels[ $label_key ] ) ) {
			$labels[ $label_key ] = (string) $stored_labels[ $label_key ];
		}
	}

	$supports = isset( $config['supports'] ) && is_array( $config['supports'] )
		? array_values( array_filter( $config['supports'], 'is_string' ) )
		: array();
	if ( empty( $supports ) ) {
		// register_post_type() defaults to title+editor when supports is empty;
		// preserve that intent rather than disabling all features.
		$supports = array( 'title', 'editor' );
	}

	$is_hierarchical = ! empty( $config['hierarchical'] );

	// Hierarchical post types need `page-attributes` for the parent picker
	// (and menu order) to render in the block editor — `hierarchical` alone
	// flips a flag in the registry but exposes no UI. Adding it implicitly
	// here so the toggle "just works" without forcing users to also remember
	// to check `page-attributes` in supports.
	if ( $is_hierarchical && ! in_array( 'page-attributes', $supports, true ) ) {
		$supports[] = 'page-attributes';
	}

	$args = array(
		'labels'       => $labels,
		'public'       => ! empty( $config['public'] ),
		'hierarchical' => $is_hierarchical,
		'has_archive'  => ! empty( $config['has_archive'] ),
		'show_in_rest' => isset( $config['show_in_rest'] ) ? (bool) $config['show_in_rest'] : true,
		'supports'     => $supports,
	);

	if ( ! empty( $config['description'] ) ) {
		$args['description'] = (string) $config['description'];
	}

	// `taxonomies` here is the inverse of the taxonomy record's `object_type`:
	// it lists the taxonomies attached to this post type. Only existing
	// taxonomies are passed through so we never reference unregistered slugs.
	if ( isset( $config['taxonomies'] ) && is_array( $config['taxonomies'] ) ) {
		$taxonomies = array();
		foreach ( $config['taxonomies'] as $tax_slug ) {
			if ( is_string( $tax_slug ) && taxonomy_exists( $tax_slug ) ) {
				$taxonomies[] = $tax_slug;
			}
		}
		if ( ! empty( $taxonomies ) ) {
			$args['taxonomies'] = $taxonomies;
		}
	}

	return array( $slug, $args );
}

/**
 * Materializes stored wp_user_post_type records into live registered
 * post types by reading each published record and calling register_post_type()
 * with a tightly-validated subset of its stored config.
 *
 * Drafts (post_status != 'publish') are skipped, so Edit's Active toggle
 * gates whether a record is actually registered.
 */
function gutenberg_register_user_defined_post_types() {
	$records = get_posts(
		array(
			'post_type'        => 'wp_user_post_type',
			'post_status'      => 'publish',
			'posts_per_page'   => -1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
		)
	);

	foreach ( $records as $record ) {
		$built = gutenberg_build_user_post_type_args( $record );
		if ( null === $built ) {
			continue;
		}
		list( $slug, $args ) = $built;

		// Defense-in-depth: never overwrite an existing post type registration,
		// even if a bad record slipped past server-side slug validation.
		if ( post_type_exists( $slug ) ) {
			continue;
		}

		register_post_type( $slug, $args );
	}
}
// Priority 20 — must run before gutenberg_register_user_defined_taxonomies() (priority 25)
// so user CPT slugs exist when register_taxonomy() records the object_type association.
add_action( 'init', 'gutenberg_register_user_defined_post_types', 20 );
