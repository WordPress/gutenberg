<?php
/**
 * Experiment to disable TinyMCE and the Classic block.
 *
 * @package gutenberg
 */

// Power on/off button controlled by a Gutenberg experiment checkbox.
$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( ! $gutenberg_experiments || ! array_key_exists( 'gutenberg-no-tinymce', $gutenberg_experiments ) ) {
	return;
}

// If user has already requested TinyMCE, we're ending the experiment.
if ( isset( $_COOKIE['requiresTinymce'] ) ) {
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
 * Detects TinyMCE usage and sets the `requiresTinymce` cookie to stop disabling TinyMCE loading. 
 */
function gutenberg_enqueue_tinymce_proxy() {
	wp_enqueue_script( 'gutenberg-tinymce-proxy', plugins_url( 'assets/tinymce-proxy.js' , __FILE__ ) );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_tinymce_proxy' );

/**
 * Example TinyMCE usage used for testing.
 * Uncomment the last line of this file to enable. 
 */
function gutenberg_test_tinymce_access() {
	echo '<script type="text/javascript">const a = window.tinymce.$;</script>';
}

// Uncomment the following line to force an external TinyMCE usage.
// add_action( 'admin_footer', 'gutenberg_test_tinymce_access' );