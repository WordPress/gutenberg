<?php

/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://wordpress.github.io/gutenberg/
 * Description: Prototyping since 1440. Development plugin for the editor focus in core.
 * Version: 0.1
 */

add_action( 'admin_menu', 'gutenberg_menu' );

function gutenberg_menu() {
	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'manage_options',
		'gutenberg',
		'the_gutenberg_project'
	);
}

function gutenberg_scripts_and_styles( $hook ) {
	if ( $hook === 'toplevel_page_gutenberg' ) {
		wp_enqueue_script( 'gutenberg_js', plugins_url( 'build/app.js', __FILE__ ) );
	}
}
add_action( 'admin_enqueue_scripts', 'gutenberg_scripts_and_styles' );

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
