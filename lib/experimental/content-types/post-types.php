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
 * Registers the wp_user_post_type CPT.
 */
function gutenberg_register_user_post_type_cpt() {
	register_post_type(
		'wp_user_post_type',
		array(
			'labels'             => array(
				'name'          => __( 'User post types', 'gutenberg' ),
				'singular_name' => __( 'User post type', 'gutenberg' ),
				'add_new_item'  => __( 'Add post type', 'gutenberg' ),
			),
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_menu'       => false,
			'show_in_rest'       => true,
			'rest_base'          => 'user-post-types',
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

add_action( 'init', 'gutenberg_register_user_post_type_cpt' );

/**
 * Builds register_post_type() arguments from a wp_user_post_type record.
 * Returns null for invalid records so callers can skip them uniformly.
 *
 * @param WP_Post $record Stored post type record.
 * @return array{0: string, 1: array}|null [ $slug, $args ].
 */
function gutenberg_build_user_post_type_args( WP_Post $record ) {
	$slug = $record->post_name;
	// register_post_type() limits the slug to 20 chars and a small charset.
	if ( ! is_string( $slug ) || ! preg_match( '/^[a-z0-9_-]{1,20}$/', $slug ) ) {
		return null;
	}

	$config = json_decode( (string) $record->post_content, true, 8 );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $config ) ) {
		return null;
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

	// Validate `supports` against a known allowlist; unknown features are dropped.
	$allowed_supports = array(
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
	$supports         = array();
	if ( isset( $config['supports'] ) && is_array( $config['supports'] ) ) {
		foreach ( $config['supports'] as $feature ) {
			if ( is_string( $feature ) && in_array( $feature, $allowed_supports, true ) ) {
				$supports[] = $feature;
			}
		}
	}
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

	if ( isset( $config['description'] ) && is_string( $config['description'] ) ) {
		$description = sanitize_textarea_field( $config['description'] );
		if ( '' !== $description ) {
			$args['description'] = $description;
		}
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
add_action( 'init', 'gutenberg_register_user_defined_post_types', 20 );

/**
 * Rejects a wp_user_post_type save when its slug collides with an existing
 * post type or another wp_user_post_type post. Primary server-side defense —
 * the Add/Edit modals do the same check client-side for UX, but the server
 * enforces the invariant.
 *
 * @param stdClass $prepared_post Post object prepared for insertion.
 * @return stdClass|WP_Error Filtered post object, or WP_Error to abort.
 */
function gutenberg_validate_user_post_type_slug( $prepared_post ) {
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

	// Another wp_user_post_type post already owns this slug → reject.
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

	// Registered post type owns this slug (core / plugin) → reject. Our own
	// materializer runs at init priority 20 and skips colliding slugs, so a
	// post_type_exists() hit here means a non-user-post-type registration.
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

	return $prepared_post;
}
add_filter( 'rest_pre_insert_wp_user_post_type', 'gutenberg_validate_user_post_type_slug' );
