<?php
/**
 * Plugin Name: block_plugin_name
 * Version: 1.0.0
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 *
 * @package block_plugin_name
 */

/**
 * Enqueue editor and front end assets.
 *
 * @since 1.0.0
 */
function block_plugin_name_enqueue_block_assets() {
	wp_enqueue_style(
		'block_plugin_name-css',
		plugins_url( 'src/style.css', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'src/style.css' )
	);
}
add_action( 'enqueue_block_assets', 'block_plugin_name_enqueue_block_assets' );

/**
 * Enqueue editor assets.
 *
 * @since 1.0.0
 */
function block_plugin_name_enqueue_block_editor_assets() {
	wp_enqueue_script(
		'block_plugin_name-js',
		plugins_url( 'build/index.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'build/index.js' )
	);
	wp_enqueue_style(
		'block_plugin_name-editor-css',
		plugins_url( 'src/editor.css', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'src/editor.css' )
	);
}
add_action( 'enqueue_block_editor_assets', 'block_plugin_name_enqueue_block_editor_assets' );
