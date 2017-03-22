<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://wordpress.github.io/gutenberg/
 * Description: Prototyping since 1440. Development plugin for the editor focus in core.
 * Version: 0.1.0
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'manage_options',
		'gutenberg',
		'the_gutenberg_project'
	);
}

add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Registers common scripts to be used as dependencies of the editor and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts() {
	wp_register_script( 'wp-element', plugins_url( 'modules/element/build/index.js', __FILE__ ) );
	wp_register_script( 'wp-blocks', plugins_url( 'modules/blocks/build/index.js', __FILE__ ), array( 'wp-element' ) );
}
add_action( 'init', 'gutenberg_register_scripts' );

/**
 * Scripts & Styles.
 *
 * Enqueues the needed scripts and styles when visiting the top-level page of
 * the Gutenberg editor.
 *
 * @param string $hook Screen name.
 * @since 0.1.0
 */
function gutenberg_scripts_and_styles( $hook ) {
	if ( 'toplevel_page_gutenberg' === $hook ) {
		wp_register_script( 'gutenberg-content', plugins_url( 'docs/shared/post-content.js', __FILE__ ) );
		wp_enqueue_script( 'wp-editor', plugins_url( 'modules/editor/build/index.js', __FILE__ ), array( 'wp-blocks', 'wp-element', 'gutenberg-content' ), false, true );
		wp_add_inline_script( 'wp-editor', 'wp.editor.createEditorInstance( \'editor\', { content: window.content } );' );
	}
}

add_action( 'admin_enqueue_scripts', 'gutenberg_scripts_and_styles' );

/**
 * Project.
 *
 * The main entry point for the Gutenberg editor. Renders the editor on the
 * wp-admin page for the plugin.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	?>
	<div class="gutenberg">
		<section id="editor" class="gutenberg__editor" contenteditable="true"></section>
	</div>
	<?php
}

/**
 * Registers a block.
 *
 * @param  string $name Block name including namespace.
 * @param  array  $args Optional. Array of settings for the block. Default
 *                      empty array.
 * @return bool         True on success, false on error.
 */
function register_block( $name, $args = array() ) {
	// Not implemented yet.
}
