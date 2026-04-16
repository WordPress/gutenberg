<?php
/**
 * Plugin Name: Gutenberg Test Slim Editor Block Editor
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers an admin page with a minimal BlockEditorProvider setup
 * (no iframe, no full editor chrome) to test standalone block editor
 * behavior similar to Press This and other slim editor integrations.
 *
 * @package gutenberg-test-slim-editor-block-editor
 */

/**
 * Register the admin page.
 */
function gutenberg_test_slim_editor_admin_menu() {
	add_menu_page(
		'Slim Editor Test',
		'Slim Editor Test',
		'edit_posts',
		'slim-editor-test',
		'gutenberg_test_slim_editor_render_page',
		'',
		99
	);
}
add_action( 'admin_menu', 'gutenberg_test_slim_editor_admin_menu' );

/**
 * Enqueue scripts for the admin page.
 *
 * @param string $hook_suffix The admin page hook suffix.
 */
function gutenberg_test_slim_editor_enqueue_scripts( $hook_suffix ) {
	if ( 'toplevel_page_slim-editor-test' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_script(
		'gutenberg-test-slim-editor',
		plugins_url( 'slim-editor-block-editor/index.js', __FILE__ ),
		array(
			'wp-block-editor',
			'wp-block-library',
			'wp-blocks',
			'wp-components',
			'wp-data',
			'wp-element',
			'wp-format-library',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'slim-editor-block-editor/index.js' ),
		true
	);

	wp_enqueue_style( 'wp-edit-blocks' );
	wp_enqueue_style( 'wp-components' );
	wp_enqueue_style( 'wp-format-library' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_test_slim_editor_enqueue_scripts' );

/**
 * Render the admin page container.
 */
function gutenberg_test_slim_editor_render_page() {
	echo '<div id="slim-editor-root" style="max-width: 720px; margin: 40px auto;"></div>';
}
