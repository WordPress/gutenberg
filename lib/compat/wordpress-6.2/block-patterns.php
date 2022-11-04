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
	register_block_pattern_category(
		'featured',
		array(
			'label' => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A set of high quality curated patterns.', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_core_block_patterns_and_categories' );
