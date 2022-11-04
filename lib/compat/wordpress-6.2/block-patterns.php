<?php
/**
 * Overrides Core's wp-includes/block-patterns.php to add category descriptions for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern categories REST API routes.
 */
function gutenberg_register_core_block_patterns_and_categories() {
	// Featured.
	register_block_pattern_category(
		'featured',
		array(
			'label' => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A set of high quality curated patterns.', 'gutenberg' ),
		)
	);

	// Classic categories.
	register_block_pattern_category(
		'buttons',
		array(
			'label' => _x( 'Buttons', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns that contain buttons and call to actions.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'columns',
		array(
			'label' => _x( 'Columns', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Multi column patterns with more complex layouts.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'footer',
		array(
			'label' => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of footer designs displaying information and site navigation.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'gallery',
		array(
			'label' => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns containing mostly images or other media.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'header',
		array(
			'label' => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of header designs displaying your site title and navigation.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'text',
		array(
			'label' => _x( 'Text', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns containing mostly text.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'query',
		array(
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		)
	);

	/*
	// Future categories, universal.
	register_block_pattern_category(
		'call-to-action',
		array(
			'label'       => _x( 'Call to Action', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Sections whose purpose is to trigger a specific action.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'team',
		array(
			'label'       => _x( 'Team', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs to display your team members.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'testimonials',
		array(
			'label'       => _x( 'Testimonials', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Share reviews and feedback about your brand/business.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'services',
		array(
			'label'       => _x( 'Services', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Briefly describe what your business does and how you can help.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'contact',
		array(
			'label'       => _x( 'Contact', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your contact information.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'about',
		array(
			'label'       => _x( 'About', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Introduce yourself.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'portfolio',
		array(
			'label'       => _x( 'Portfolio', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Showcase your latest work.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'gallery',
		array(
			'label'       => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts for displaying images.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'media',
		array(
			'label'       => _x( 'Media', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts containing video or audio.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'query',
		array(
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'products',
		array(
			'label'       => _x( 'Products', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your store’s products in lists, grids or other layouts.', 'gutenberg' ),
		)
	);

	// Future categories, site building.
	register_block_pattern_category(
		'footer',
		array(
			'label'       => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of footer designs displaying information and site navigation.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'header',
		array(
			'label'       => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of header designs displaying your site title and navigation.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'post-content',
		array(
			'label'       => _x( 'Post Content', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Your post and page content.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'comments',
		array(
			'label'       => _x( 'Comments', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different ways of displaying your post or page\'s comments.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'pagination',
		array(
			'label'       => _x( 'Pagination', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs for navigating your posts.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'comment-pagination',
		array(
			'label'       => _x( 'Comment Pagination', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs to browse through a big list of comments.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'archive-headings',
		array(
			'label'       => _x( 'Archive Headings', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs for your archive heading.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'404',
		array(
			'label'       => _x( '404', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs for when a page cannot be found.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'search',
		array(
			'label'       => _x( 'Search', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts to display search results.', 'gutenberg' ),
		)
	);
	*/
}
add_action( 'init', 'gutenberg_register_core_block_patterns_and_categories' );
