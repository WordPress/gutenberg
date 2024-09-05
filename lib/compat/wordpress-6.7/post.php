<?php
/**
 * Overrides Core Post APIs.
 *
 * @package gutenberg
 */

/**
 * Disables autosave for `wp_template` and `wp_template_part` post types.
 *
 * @return void
 */
function gutenberg_disable_templates_and_parts_autosave() {
	remove_post_type_support( 'wp_template', 'autosave' );
	remove_post_type_support( 'wp_template_part', 'autosave' );
}
add_action( 'init', 'gutenberg_disable_templates_and_parts_autosave' );
