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
	 * Taxonomy term slug used for the site-wide guidelines singleton.
	 *
	 * The site-wide guidelines post managed by the Settings → Guidelines page
	 * carries this term; it maps to the `guideline` built-in knowledge type.
	 *
	 * @var string
	 */
	const TERM_GUIDELINE = 'guideline';

	/**
	 * The standard guideline category meta keys.
	 *
	 * @var array
	 */
	const CATEGORY_META_KEYS = array(
		'copy',
		'images',
		'site',
		'additional',
	);

	/**
	 * All valid guideline category keys for filtering.
	 *
	 * Includes standard categories plus 'blocks'.
	 *
	 * @var array
	 */
	const VALID_CATEGORIES = array(
		'copy',
		'images',
		'site',
		'additional',
		'blocks',
	);

	/**
	 * Valid guideline statuses.
	 *
	 * @var array
	 */
	const VALID_STATUSES = array(
		'draft',
		'publish',
	);

	/**
	 * Prefix for block-specific guideline meta keys.
	 *
	 * @var string
	 */
	const BLOCK_META_PREFIX = '_guideline_block_';

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
	}

	/**
	 * Determines whether a knowledge post belongs to the site-wide
	 * guidelines singleton.
	 *
	 * Used by the /wp/v2/content-guidelines route to reject posts without
	 * the `guideline` term addressed by ID — those belong to the standard
	 * /wp/v2/knowledge collection.
	 *
	 * @param int $post_id Post ID.
	 * @return bool True if the post has the `guideline` term.
	 */
	public static function is_content_guideline( $post_id ) {
		$terms = get_the_terms( $post_id, self::TAXONOMY );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return false;
		}

		foreach ( $terms as $term ) {
			if ( self::TERM_GUIDELINE === $term->slug ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Register post meta fields with revision support.
	 */
	public static function register_post_meta(): void {
		$meta_args = array(
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
			'revisions_enabled' => true,
			'auth_callback'     => function (): bool {
				return current_user_can( 'manage_options' );
			},
			'sanitize_callback' => 'sanitize_textarea_field',
		);

		// Register standard category meta.
		foreach ( self::CATEGORY_META_KEYS as $category ) {
			register_post_meta( self::POST_TYPE, '_guideline_' . $category, $meta_args );
		}

		// Register meta for content blocks.
		foreach ( self::get_content_blocks() as $block_name ) {
			register_post_meta( self::POST_TYPE, self::block_name_to_meta_key( $block_name ), $meta_args );
		}
	}

	/**
	 * Get block names that have content role attributes.
	 *
	 * @return array Block names with content role.
	 */
	public static function get_content_blocks(): array {
		$content_blocks = array();
		$registry       = WP_Block_Type_Registry::get_instance();

		foreach ( $registry->get_all_registered() as $block_type ) {
			if ( self::block_has_content_role( $block_type ) ) {
				$content_blocks[] = $block_type->name;
			}
		}

		return $content_blocks;
	}

	/**
	 * Check if a block type has any attribute with content role.
	 *
	 * @param WP_Block_Type $block_type The block type to check.
	 * @return bool True if block has content role attribute.
	 */
	private static function block_has_content_role( WP_Block_Type $block_type ): bool {
		if ( empty( $block_type->attributes ) ) {
			return false;
		}

		foreach ( $block_type->attributes as $attribute ) {
			if ( isset( $attribute['role'] ) && 'content' === $attribute['role'] ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Convert a block name to a meta key.
	 *
	 * @param string $block_name The block name (e.g., 'core/paragraph').
	 * @return string The meta key (e.g., '_guideline_block_core_paragraph').
	 */
	public static function block_name_to_meta_key( string $block_name ): string {
		// Replace '/' with '_' to create a valid meta key.
		$sanitized = str_replace( '/', '_', $block_name );
		return self::BLOCK_META_PREFIX . $sanitized;
	}

	/**
	 * Convert a meta key back to a block name.
	 *
	 * @param string $meta_key The meta key (e.g., '_guideline_block_core_paragraph').
	 * @return string The block name (e.g., 'core/paragraph').
	 */
	public static function meta_key_to_block_name( string $meta_key ): string {
		// Remove prefix and convert first '_' back to '/'.
		$without_prefix = str_replace( self::BLOCK_META_PREFIX, '', $meta_key );
		// Replace first underscore with '/' (namespace separator).
		return preg_replace( '/_/', '/', $without_prefix, 1 );
	}

	/**
	 * Check if a meta key is a block guideline meta key.
	 *
	 * @param string $meta_key The meta key to check.
	 * @return bool True if it's a block guideline meta key.
	 */
	public static function is_block_meta_key( string $meta_key ): bool {
		return str_starts_with( $meta_key, self::BLOCK_META_PREFIX );
	}

	/**
	 * Gets guideline categories from post meta.
	 *
	 * Shared between the post controller and revisions controller.
	 *
	 * @param int $post_id Post ID (can be a post or revision ID).
	 * @return array Guideline categories.
	 */
	public static function get_guideline_categories_from_meta( int $post_id ): array {
		$category_labels = array(
			'copy'       => __( 'Copy Guidelines', 'gutenberg' ),
			'images'     => __( 'Image Guidelines', 'gutenberg' ),
			'site'       => __( 'Site Context', 'gutenberg' ),
			'additional' => __( 'Additional Guidelines', 'gutenberg' ),
		);

		$guideline_categories = array();

		// Get standard categories.
		foreach ( self::CATEGORY_META_KEYS as $category ) {
			$meta_key = '_guideline_' . $category;
			$value    = get_post_meta( $post_id, $meta_key, true );

			$guideline_categories[ $category ] = array(
				'label'      => $category_labels[ $category ],
				'guidelines' => $value,
			);
		}

		// Get block-specific guidelines from individual meta keys.
		$all_meta = get_post_meta( $post_id );

		$blocks = array();
		foreach ( $all_meta as $meta_key => $meta_values ) {
			if ( self::is_block_meta_key( $meta_key ) ) {
				$block_name = self::meta_key_to_block_name( $meta_key );
				$value      = $meta_values[0] ?? '';

				if ( ! empty( $value ) ) {
					$blocks[ $block_name ] = array(
						'guidelines' => $value,
					);
				}
			}
		}

		if ( ! empty( $blocks ) ) {
			$guideline_categories['blocks'] = $blocks;
		}

		return $guideline_categories;
	}
}
