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
	wp_register_script( 'wp-elements', plugins_url( 'modules/elements/build/index.js', __FILE__ ) );
	wp_register_script( 'wp-blocks', plugins_url( 'modules/blocks/build/index.js', __FILE__ ), array( 'wp-elements' ) );
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
		wp_enqueue_script( 'wp-editor', plugins_url( 'modules/editor/build/index.js', __FILE__ ), array( 'wp-blocks', 'wp-elements' ) );
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
		<section class="gutenberg__editor" contenteditable="true">
			<h2>1.0 Is The Loneliest Number</h2>
			<p>Many entrepreneurs idolize Steve Jobs. He’s such a <a href=""><span class="space-sep">&nbsp;</span>perfectionist<span class="space-sep-end">&nbsp;</span></a>, they say. Nothing leaves the doors of 1 Infinite Loop in Cupertino without a polish and finish that makes geeks everywhere drool. No compromise!</p>
			<img alt="" src="https://cldup.com/HN3-c7ER9p.jpg" />
			<p>I like Apple for the opposite reason: they’re not afraid of getting a rudimentary 1.0 out into the world.</p>
		</section>
	</div>
	<?php
}

/**
 * Registers a block.
 *
 * @param  string $namespace Block grouping unique to package or plugin.
 * @param  string $block     Block name.
 * @param  array  $args      Optional. Array of settings for the block. Default empty array.
 * @return bool              True on success, false on error.
 */
function register_block( $namespace, $block, $args = array() ) {

}
