<?php
/**
 * Add categories tp new wp_patterns taxonomy for WP 6.3.
 *
 * @package gutenberg
 */
function gutenberg_register_wp_patterns_taxonomy_categories() {
	$categories = array(
		array(
			'slug'        => 'banner',
			'label'       => _x( 'Banners', 'Block pattern category', 'gutenberg' ),
			'description' => __( '', 'gutenberg' ),
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
add_action( 'init', 'gutenberg_register_wp_patterns_taxonomy_categories', 20 );
