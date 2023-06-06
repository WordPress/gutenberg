<?php
/**
 * Overrides Core's wp-includes/block-patterns.php to add new wp_patterns taxonomy for WP 6.3.
 *
 * @package gutenberg
 */

/**
 * Adds a new taxonomy for organizing patterns.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @return void
 */
function gutenberg_register_taxonomy_patterns() {
	$labels = array(
		'name'          => _x( 'Patterns', 'taxonomy general name' ),
		'singular_name' => _x( 'Pattern', 'taxonomy singular name' ),
		'search_items'  => __( 'Search Patterns' ),
		'all_items'     => __( 'All Pattern Categories' ),
		'edit_item'     => __( 'Edit Pattern Category' ),
		'update_item'   => __( 'Update Pattern Category' ),
		'add_new_item'  => __( 'Add New Pattern Category' ),
		'new_item_name' => __( 'New Pattern Category Name' ),
		'menu_name'     => __( 'Pattern' ),
	);
	$args   = array(
		'hierarchical'      => false,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_in_menu'      => true,
		'show_in_nav_menus' => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'show_in_rest'      => true,
		'rewrite'           => array( 'slug' => 'wp_pattern' ),
	);
	register_taxonomy( 'wp_pattern', array( 'wp_block' ), $args );
}
add_action( 'init', 'gutenberg_register_taxonomy_patterns' );

/**
 * Add categories to new wp_patterns taxonomy for WP 6.3.
 *
 * @package gutenberg
 */
function gutenberg_register_wp_patterns_taxonomy_categories() {
	$categories = array(
		array(
			'slug'        => 'banner',
			'label'       => _x( 'Banners', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns used for adding banners', 'gutenberg' ),
		),
		array(
			'slug'        => 'buttons',
			'label'       => _x( 'Buttons', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns that contain buttons and call to actions.', 'gutenberg' ),
		),
		array(
			'slug'        => 'columns',
			'label'       => _x( 'Columns', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Multi-column patterns with more complex layouts.', 'gutenberg' ),
		),
		array(
			'slug'        => 'text',
			'label'       => _x( 'Text', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns containing mostly text.', 'gutenberg' ),
		),
		array(
			'slug'        => 'query',
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		),
		array(
			'slug'        => 'featured',
			'label'       => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A set of high quality curated patterns.', 'gutenberg' ),
		),

		// Register new core block pattern categories.
		array(
			'slug'        => 'call-to-action',
			'label'       => _x( 'Call to Action', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Sections whose purpose is to trigger a specific action.', 'gutenberg' ),
		),
		array(
			'slug'        => 'team',
			'label'       => _x( 'Team', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs to display your team members.', 'gutenberg' ),
		),
		array(
			'slug'        => 'testimonials',
			'label'       => _x( 'Testimonials', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Share reviews and feedback about your brand/business.', 'gutenberg' ),
		),
		array(
			'slug'        => 'services',
			'label'       => _x( 'Services', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Briefly describe what your business does and how you can help.', 'gutenberg' ),
		),
		array(
			'slug'        => 'contact',
			'label'       => _x( 'Contact', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your contact information.', 'gutenberg' ),
		),
		array(
			'slug'        => 'about',
			'label'       => _x( 'About', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Introduce yourself.', 'gutenberg' ),
		),
		array(
			'slug'        => 'portfolio',
			'label'       => _x( 'Portfolio', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Showcase your latest work.', 'gutenberg' ),
		),
		array(
			'slug'        => 'gallery',
			'label'       => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts for displaying images.', 'gutenberg' ),
		),
		array(
			'slug'        => 'media',
			'label'       => _x( 'Media', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts containing video or audio.', 'gutenberg' ),
		),
		array(
			'slug'        => 'posts',
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		),
		// Site building pattern categories.
		array(
			'slug'        => 'footer',
			'label'       => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of footer designs displaying information and site navigation.', 'gutenberg' ),
		),
		array(
			'slug'        => 'header',
			'label'       => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of header designs displaying your site title and navigation.', 'gutenberg' ),
		),
	);

	foreach ( $categories as $category ) {
		if ( empty( term_exists( $category['slug'], 'wp_pattern' ) ) ) {
			wp_insert_term(
				$category['label'],
				'wp_pattern',
				array(
					'slug'        => $category['slug'],
					'description' => $category['description'],
				)
			);
		}
	}
}
add_action( 'init', 'gutenberg_register_wp_patterns_taxonomy_categories', 20 );
