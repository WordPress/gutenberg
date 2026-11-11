<?php
/**
 * WordPress 7.3 compatibility functions for the Gutenberg
 * editor plugin changes related to the post editor screen.
 *
 * @package gutenberg
 */

/**
 * Stops WordPress from adding its own posts page notice to the post editor.
 *
 * The editor now shows this notice itself, in the post editor and the site
 * editor, while the page being edited is the posts page. WordPress also adds
 * it from the server when the post editor loads, which would show it twice.
 *
 * `wp-admin/edit-form-blocks.php` hooks `_wp_block_editor_posts_page_notice()`
 * to `admin_enqueue_scripts` while the screen loads, after plugins have
 * loaded, so it can only be unhooked from that action, before it runs.
 */
function gutenberg_remove_block_editor_posts_page_notice() {
	remove_action( 'admin_enqueue_scripts', '_wp_block_editor_posts_page_notice' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_remove_block_editor_posts_page_notice', 9 );
