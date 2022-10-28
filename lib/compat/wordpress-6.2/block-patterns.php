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
		)
	);
	register_block_pattern_category(
		'columns',
		array(
			'label' => _x( 'Columns', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'footer',
		array(
			'label' => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'gallery',
		array(
			'label' => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'header',
		array(
			'label' => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'text',
		array(
			'label' => _x( 'Text', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'query',
		array(
			'label'       => _x( 'Query', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display post summaries in lists, grids, and other layouts', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'featured',
		array(
			'label' => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_core_block_patterns_and_categories' );
