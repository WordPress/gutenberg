<?php
/**
 * Extends Core's wp-includes/block-patterns.php to add new media related
 * pattern categories for WP 6.5.
 *
 * @package gutenberg
 */

/**
 * Adds new pattern categories for better organization of media related patterns.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.5.
 *
 * @return void
 */
function gutenberg_register_media_pattern_categories() {
	// Register new categories.
	register_block_pattern_category(
		'videos',
		array(
			'label'       => _x( 'Videos', 'Block pattern category' ),
			'description' => __( 'Different layouts containing videos.' ),
		)
	);
	register_block_pattern_category(
		'audio',
		array(
			'label'       => _x( 'Audio', 'Block pattern category' ),
			'description' => __( 'Different layouts containing audio.' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_media_pattern_categories' );

/**
 * Adds a new taxonomy for organizing user created patterns.
 *
 * @see https://github.com/WordPress/gutenberg/pull/53163
 *
 * @return void
 */
function gutenberg_register_taxonomy_patterns() {
	$args = array(
		'public'             => false,
		'publicly_queryable' => false,
		'hierarchical'       => false,
		'labels'             => array(
			'name'                       => _x( 'Pattern Categories', 'taxonomy general name' ),
			'singular_name'              => _x( 'Pattern Category', 'taxonomy singular name' ),
			'add_new_item'               => __( 'Add New Category' ),
			'add_or_remove_items'        => __( 'Add or remove pattern categories' ),
			'back_to_items'              => __( '&larr; Go to Pattern Categories' ),
			'choose_from_most_used'      => __( 'Choose from the most used pattern categories' ),
			'edit_item'                  => __( 'Edit Pattern Category' ),
			'item_link'                  => __( 'Pattern Category Link' ),
			'item_link_description'      => __( 'A link to a pattern category.' ),
			'items_list'                 => __( 'Pattern Categories list' ),
			'items_list_navigation'      => __( 'Pattern Categories list navigation' ),
			'new_item_name'              => __( 'New Pattern Category Name' ),
			'no_terms'                   => __( 'No pattern categories' ),
			'not_found'                  => __( 'No pattern categories found.' ),
			'popular_items'              => __( 'Popular Pattern Categories' ),
			'search_items'               => __( 'Search Pattern Categories' ),
			'separate_items_with_commas' => __( 'Separate pattern categories with commas' ),
			'update_item'                => __( 'Update Pattern Category' ),
			'view_item'                  => __( 'View Pattern Category' ),
		),
		'query_var'          => false,
		'rewrite'            => false,
		'show_ui'            => true,
		'_builtin'           => true,
		'show_in_nav_menus'  => false,
		'show_in_rest'       => true,
		'show_admin_column'  => true,
		'show_tagcloud'      => false,
	);
	register_taxonomy( 'wp_pattern_category', array( 'wp_block' ), $args );
}
add_action( 'init', 'gutenberg_register_taxonomy_patterns' );
