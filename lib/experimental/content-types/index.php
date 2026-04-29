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
 * Self-identifying key embedded in stored `post_content` JSON. Mirrors
 * core's `isGlobalStylesUserThemeJSON` for `wp_global_styles`.
 *
 * Not load-bearing today: writes are sanitized via `wp_insert_post_data`,
 * which carries `post_type` context, so payload identification doesn't
 * need a marker. The marker is preserved as a forward-compat anchor for
 * a content-only fallback sanitizer — e.g., if a future write path turns
 * out to bypass `wp_insert_post_data`, or a kses-ordering issue forces a
 * fallback to `content_save_pre`. In those scenarios a content-only
 * sanitizer can't safely identify our payloads without a marker, and
 * retroactively migrating stored records across WP installs is not
 * practical, so the marker is present from day one.
 *
 * Storage-only: kept out of the REST schema and stripped on read so it
 * never reaches clients.
 */
const GUTENBERG_USER_TAXONOMY_CONFIG_MARKER = 'isUserTaxonomyConfigJSON';

/**
 * Regex for a valid taxonomy slug. 32 chars matches the `wp_terms.slug`
 * column width.
 */
const GUTENBERG_USER_TAXONOMY_SLUG_PATTERN = '/^[a-z0-9_-]{1,32}$/';

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
		)
	);
}

add_action( 'init', 'gutenberg_register_user_taxonomy_cpt' );

/**
 * Sanitizes a decoded taxonomy config to the canonical shape declared by
 * the REST controller's config schema. Single sanitization site for
 * taxonomy records — called from {@see gutenberg_filter_user_taxonomy_post_content}
 * on `wp_insert_post_data`.
 *
 * @param array $config Raw decoded config.
 * @return array Sanitized config.
 */
function gutenberg_user_taxonomy_sanitize_config( $config ) {
	if ( ! is_array( $config ) ) {
		return array();
	}

	$clean = rest_sanitize_value_from_schema(
		$config,
		WP_REST_User_Taxonomies_Controller_Gutenberg::get_config_schema()
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
 * Sanitizes wp_user_taxonomy JSON `post_content` during `wp_insert_post`.
 *
 * Acts on posts of type `wp_user_taxonomy`. Returns input unchanged for
 * any other post type. Invalid JSON is normalized to the canonical
 * marker-only payload rather than passed through. The filter is
 * unconditional — taxonomy config isn't HTML and shouldn't carry scripts
 * even for users with `unfiltered_html`.
 *
 * @param array $data Slashed post data being inserted/updated.
 * @return array Filtered data.
 */
function gutenberg_filter_user_taxonomy_post_content( $data ) {
	if ( ! isset( $data['post_type'], $data['post_content'] ) ) {
		return $data;
	}

	if ( 'wp_user_taxonomy' !== $data['post_type'] ) {
		return $data;
	}

	$decoded = json_decode( wp_unslash( (string) $data['post_content'] ), true );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		// Hedge: invalid JSON falls through to a canonical empty payload so
		// a stray read path can't surface arbitrary bytes. The marker is
		// added below, keeping the stored shape uniform.
		$decoded = array();
	}

	$clean = gutenberg_user_taxonomy_sanitize_config( $decoded );

	// Storage-only marker: deliberately not in the REST schema so it can
	// never reach clients. Kept as a forward-compat anchor for a
	// content-only fallback sanitizer; full rationale on the const.
	$clean[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] = true;

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
			WP_REST_User_Taxonomies_Controller_Gutenberg::normalize_config_for_encode( $clean ),
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
	if ( ! is_string( $slug ) || ! preg_match( GUTENBERG_USER_TAXONOMY_SLUG_PATTERN, $slug ) ) {
		return null;
	}

	$decoded = json_decode( (string) $record->post_content, true, 8 );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		return null;
	}
	unset( $decoded[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] );
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
 */
function gutenberg_register_user_defined_taxonomies() {
	$records = get_posts(
		array(
			'post_type'        => 'wp_user_taxonomy',
			// Drafts are skipped so the Edit "Active" toggle gates registration.
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
