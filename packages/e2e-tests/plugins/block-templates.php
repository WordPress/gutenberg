<?php
/**
 * Plugin Name: Gutenberg Test Block Templates
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-templates
 */

/**
 * Activate Block Templates.
 */
function enqueue_block_templates() {
	add_theme_support( 'block-templates' );
}

add_action( 'setup_theme', 'enqueue_block_templates' );
