<?php
/**
 * Registers the private CPTs that store user-defined content types:
 *   - wp_user_taxonomy     (user-defined taxonomies)
 *
 * Each record holds the registration intent for one taxonomy;
 * the `register_taxonomy` calls that materialize
 * these records into the live registry come in a follow-up step.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the wp_user_taxonomy CPT.
 */
function gutenberg_register_user_taxonomy_cpt() {
	register_post_type(
		'wp_user_taxonomy',
		array(
			'labels'             => array(
				'name'          => __( 'User taxonomies', 'gutenberg' ),
				'singular_name' => __( 'User taxonomy', 'gutenberg' ),
				'add_new_item'  => __( 'Add taxonomy', 'gutenberg' ),
			),
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_menu'       => false,
			'show_in_rest'       => true,
			'rest_base'          => 'user-taxonomies',
			'capability_type'    => 'post',
			'capabilities'       => array(
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
			'map_meta_cap'       => true,
			'supports'           => array( 'title', 'editor' ),
			'hierarchical'       => false,
			'has_archive'        => false,
			'rewrite'            => false,
			'query_var'          => false,
		)
	);
}

add_action( 'init', 'gutenberg_register_user_taxonomy_cpt' );

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

	$config = json_decode( (string) $record->post_content, true, 8 );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $config ) ) {
		return null;
	}

	$object_type = array();
	if ( isset( $config['object_type'] ) && is_array( $config['object_type'] ) ) {
		foreach ( $config['object_type'] as $pt_slug ) {
			if ( is_string( $pt_slug ) && post_type_exists( $pt_slug ) ) {
				$object_type[] = $pt_slug;
			}
		}
	}

	$title    = sanitize_text_field( $record->post_title );
	$singular = isset( $config['labels']['singular_name'] )
		? sanitize_text_field( (string) $config['labels']['singular_name'] )
		: '';
	$labels   = array(
		'name'          => $title,
		'singular_name' => '' !== $singular ? $singular : $title,
	);

	// Merge the optional label overrides. Empty strings fall through to the
	// WordPress-generated defaults, so we skip any label whose stored value
	// is empty after sanitization.
	$optional_label_keys = array(
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
	if ( isset( $config['labels'] ) && is_array( $config['labels'] ) ) {
		foreach ( $optional_label_keys as $label_key ) {
			if ( ! isset( $config['labels'][ $label_key ] ) ) {
				continue;
			}
			$label_value = sanitize_text_field( (string) $config['labels'][ $label_key ] );
			if ( '' !== $label_value ) {
				$labels[ $label_key ] = $label_value;
			}
		}
	}

	$args = array(
		'labels'       => $labels,
		'public'       => ! empty( $config['public'] ),
		'hierarchical' => ! empty( $config['hierarchical'] ),
		'show_in_rest' => true,
	);

	if ( isset( $config['description'] ) && is_string( $config['description'] ) ) {
		$description = sanitize_textarea_field( $config['description'] );
		if ( '' !== $description ) {
			$args['description'] = $description;
		}
	}

	return array( $slug, $object_type, $args );
}

/**
 * Materializes stored wp_user_taxonomy records into live registered
 * taxonomies by reading each published record and calling register_taxonomy()
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
 * taxonomy or another wp_user_taxonomy post. Primary server-side defense —
 * the Add/Edit modals do the same check client-side for UX, but the server
 * enforces the invariant.
 *
 * @param stdClass        $prepared_post Post object prepared for insertion.
 * @param WP_REST_Request $request       The REST request.
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
	// materializer runs at init priority 20 and skips colliding slugs, so a
	// taxonomy_exists() hit here means a non-user-taxonomy registration.
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
