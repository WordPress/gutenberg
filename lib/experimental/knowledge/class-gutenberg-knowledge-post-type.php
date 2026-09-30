<?php
/**
 * Knowledge Post Type registration.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles registration of the Knowledge custom post type.
 */
class Gutenberg_Knowledge_Post_Type {

	/**
	 * The post type name.
	 *
	 * @var string
	 */
	const POST_TYPE = 'wp_knowledge';

	/**
	 * The taxonomy name for knowledge types.
	 *
	 * @var string
	 */
	const TAXONOMY = 'wp_knowledge_type';

	/**
	 * Taxonomy term slug for the `guideline` knowledge type.
	 *
	 * Guidelines are loaded by default when applicable; every row managed by
	 * the Settings → Guidelines page carries this term. Scope rows are further
	 * identified by the `guideline-` slug prefix (see the reservation guard in
	 * knowledge.php).
	 *
	 * @var string
	 */
	const TERM_GUIDELINE = 'guideline';

	/**
	 * Register the custom post type.
	 */
	public static function register(): void {
		if ( post_type_exists( self::POST_TYPE ) ) {
			return;
		}

		register_post_type(
			self::POST_TYPE,
			array(
				'labels'                => array(
					'name'                     => _x( 'Guidelines', 'post type general name', 'gutenberg' ),
					'singular_name'            => _x( 'Guideline', 'post type singular name', 'gutenberg' ),
					'add_new'                  => __( 'Add Guideline', 'gutenberg' ),
					'add_new_item'             => __( 'Add Guideline', 'gutenberg' ),
					'all_items'                => __( 'All Guidelines', 'gutenberg' ),
					'edit_item'                => __( 'Edit Guideline', 'gutenberg' ),
					'filter_items_list'        => __( 'Filter guidelines list', 'gutenberg' ),
					'item_published'           => __( 'Guideline published.', 'gutenberg' ),
					'item_published_privately' => __( 'Guideline published privately.', 'gutenberg' ),
					'item_reverted_to_draft'   => __( 'Guideline reverted to draft.', 'gutenberg' ),
					'item_scheduled'           => __( 'Guideline scheduled.', 'gutenberg' ),
					'item_updated'             => __( 'Guideline updated.', 'gutenberg' ),
					'items_list'               => __( 'Guidelines list', 'gutenberg' ),
					'items_list_navigation'    => __( 'Guidelines list navigation', 'gutenberg' ),
					'new_item'                 => __( 'New Guideline', 'gutenberg' ),
					'not_found'                => __( 'No guidelines found.', 'gutenberg' ),
					'not_found_in_trash'       => __( 'No guidelines found in Trash.', 'gutenberg' ),
					'search_items'             => __( 'Search Guidelines', 'gutenberg' ),
					'view_item'                => __( 'View Guideline', 'gutenberg' ),
					'view_items'               => __( 'View Guidelines', 'gutenberg' ),
				),
				'public'                => false,
				// Knowledge rows have no native post-type screens; management
				// flows through the Settings → Guidelines page (see
				// load.php) and the REST API.
				'show_ui'               => false,
				'show_in_rest'          => true,
				'rest_base'             => 'knowledge',

				'rest_controller_class' => Gutenberg_Knowledge_REST_Controller::class,

				// The primitive capabilities follow the standard plural form
				// (`edit_knowledge_items`) while the per-post meta capabilities
				// keep the singular form (`edit_knowledge_item`) — the same
				// primitive/meta split WordPress uses for posts (`edit_posts` vs
				// `edit_post`). The `*_knowledge_item` forms are never granted;
				// `map_meta_cap()` resolves them onto the primitives.
				'capability_type'       => array( 'knowledge_item', 'knowledge_items' ),
				'map_meta_cap'          => true,
				// `read` is remapped so Subscribers (who hold the base `read`
				// cap) are blocked at the post-type door. Every other primitive
				// defaults to a knowledge_items-suffixed cap synthesized by
				// `wp_maybe_grant_knowledge_caps()`.
				'capabilities'          => array(
					'read' => 'read_knowledge_items',
				),
				'supports'              => array( 'title', 'editor', 'excerpt', 'author', 'revisions' ),
				'hierarchical'          => false,
				'has_archive'           => false,
				'rewrite'               => false,
				'query_var'             => false,
				'can_export'            => true,
			)
		);

		/*
		 * Disable autosave endpoints for knowledge. 'editor' support implies
		 * 'autosave', but knowledge is headless storage with no editor session,
		 * so the autosave REST routes have no consumer. Revision history is
		 * retained.
		 */
		remove_post_type_support( self::POST_TYPE, 'autosave' );

		register_taxonomy(
			self::TAXONOMY,
			self::POST_TYPE,
			array(
				'public'             => false,
				'publicly_queryable' => false,
				'hierarchical'       => true,
				'labels'             => array(
					'name'                  => _x( 'Guideline Types', 'taxonomy general name', 'gutenberg' ),
					'singular_name'         => _x( 'Guideline Type', 'taxonomy singular name', 'gutenberg' ),
					'add_new_item'          => __( 'Add Guideline Type', 'gutenberg' ),
					'add_or_remove_items'   => __( 'Add or remove guideline types', 'gutenberg' ),
					'back_to_items'         => __( '&larr; Go to Guideline Types', 'gutenberg' ),
					'edit_item'             => __( 'Edit Guideline Type', 'gutenberg' ),
					'item_link'             => __( 'Guideline Type Link', 'gutenberg' ),
					'item_link_description' => __( 'A link to a guideline type.', 'gutenberg' ),
					'items_list'            => __( 'Guideline Types list', 'gutenberg' ),
					'items_list_navigation' => __( 'Guideline Types list navigation', 'gutenberg' ),
					'new_item_name'         => __( 'New Guideline Type Name', 'gutenberg' ),
					'no_terms'              => __( 'No guideline types', 'gutenberg' ),
					'not_found'             => __( 'No guideline types found.', 'gutenberg' ),
					'search_items'          => __( 'Search Guideline Types', 'gutenberg' ),
					'update_item'           => __( 'Update Guideline Type', 'gutenberg' ),
					'view_item'             => __( 'View Guideline Type', 'gutenberg' ),
				),
				/*
				 * Editing and assigning terms reuse the `wp_knowledge` primitive
				 * `edit_knowledge_items` so that anyone who can edit a knowledge
				 * row can also lazily create and assign its type. Managing or
				 * deleting the type vocabulary itself stays an administrator task.
				 */
				'capabilities'       => array(
					'manage_terms' => 'manage_options',
					'edit_terms'   => 'edit_knowledge_items',
					'delete_terms' => 'manage_options',
					'assign_terms' => 'edit_knowledge_items',
				),
				'query_var'          => false,
				'rewrite'            => false,
				// Headless, like the post type: knowledge type terms are managed
				// through the REST API, not a wp-admin taxonomy screen.
				'show_ui'            => false,
				'show_in_nav_menus'  => false,
				'show_in_rest'       => true,
			)
		);

		add_filter( 'user_has_cap', 'wp_maybe_grant_knowledge_caps', 1, 4 );
		add_action( 'save_post_' . self::POST_TYPE, 'wp_knowledge_ensure_default_type_term' );
		add_filter( 'wp_insert_term_data', 'wp_knowledge_maybe_map_term_label', 10, 2 );

		// Sanitize guideline content and re-stamp registry scope titles on the
		// REST insert path. Slug uniqueness is left to WordPress: the published
		// row keeps its exact slug and duplicates are suffixed (see knowledge.php).
		add_filter( 'rest_pre_insert_' . self::POST_TYPE, 'wp_knowledge_guard_guideline_row', 10, 2 );
	}
}
