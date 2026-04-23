<?php
/**
 * Experiment to disable TinyMCE and the Classic block.
 *
 * @package gutenberg
 */

// add_action( 'admin_footer', 'gutenberg_test_tinymce_access' ); // Uncomment the following line to force an external TinyMCE usage.

// If user has already requested TinyMCE, we're ending the experiment.
if ( ! empty( $_GET['requiresTinymce'] ) ) {
	return;
}

/**
 * Disable TinyMCE by introducing a placeholder `_WP_Editors` class.
 */
function gutenberg_disable_tinymce() {
	require __DIR__ . '/class--wp-editors.php';
}

add_action( 'admin_init', 'gutenberg_disable_tinymce' );

/**
 * Enqueue TinyMCE proxy script.
 * Detects TinyMCE usage and sets the `requiresTinymce` query argument to stop disabling TinyMCE loading.
 */
function gutenberg_enqueue_tinymce_proxy() {
	wp_enqueue_script( 'gutenberg-tinymce-proxy', plugins_url( 'assets/tinymce-proxy.js', __FILE__ ) );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_tinymce_proxy' );

/**
 * Dequeue the `mce-view` script as it was only necessary for the Classic block.
 */
function gutenberg_wp_enqueue_media() {
	wp_dequeue_script( 'mce-view' );
}

add_action( 'wp_enqueue_media', 'gutenberg_wp_enqueue_media' );

/**
 * Example TinyMCE usage used for testing.
 * Uncomment line 8 in this file to enable.
 */
function gutenberg_test_tinymce_access() {
	echo '<script type="text/javascript">const a = window.tinymce.$;</script>';
}
