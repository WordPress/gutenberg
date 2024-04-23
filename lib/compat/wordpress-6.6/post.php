<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Adds support for excerpt to the wp_block post type.
 */
function gutenberg_add_excerpt_support_to_wp_block() {
	add_post_type_support( 'wp_block', 'excerpt' );
}

add_action( 'init', 'gutenberg_add_excerpt_support_to_wp_block' );
