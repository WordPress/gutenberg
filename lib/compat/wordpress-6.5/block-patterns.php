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
