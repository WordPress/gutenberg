<?php
/**
 * Sets up the default filters and actions for most
 * of the WordPress hooks.
 *
 * If you need to remove a default hook, this file will
 * give you the priority to use for removing the hook.
 *
 * Not all of the default hooks are found in this file.
 * For instance, administration-related hooks are located in
 * wp-admin/includes/admin-filters.php.
 *
 * If a hook should only be called from a specific context
 * (admin area, multisite environment…), please move it
 * to a more appropriate file instead.
 *
 * @package gutenberg
 */

/**
 * This is a temporary fix to ensure that the block editor styles are enqueued
 * in the order the iframe expects.
 *
 * The wp_enqueue_registered_block_scripts_and_styles callback has been removed in core
 * as of https://github.com/WordPress/wordpress-develop/pull/4356.
 *
 * However, Gutenberg supports WordPress 6.1 and 6.2, which still have this callback.
 * Hence, why we remove it first and then re-add it.
 *
 * This way we make sure it still works the same in WordPress trunk, 6.1 and 6.2.
 */
remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_registered_block_scripts_and_styles' );
add_action( 'enqueue_block_editor_assets', 'wp_enqueue_registered_block_scripts_and_styles', 1 );
