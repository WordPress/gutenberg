<?php
/**
 * Experiment to disable TinyMCE and the Classic block.
 *
 * @package gutenberg
 */

// If user has already requested TinyMCE, we're ending the experiment.
if ( isset( $_COOKIE['requiresTinymce'] ) || gutenberg_current_content_contains_classic_block() ) {
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
	wp_enqueue_script( 'gutenberg-tinymce-proxy', plugins_url( 'assets/tinymce-proxy.js', __FILE__ ) );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_tinymce_proxy' );

/**
 * Example TinyMCE usage used for testing.
 * Uncomment the last line of this file to enable.
 */
function gutenberg_test_tinymce_access() {
	echo '<script type="text/javascript">const a = window.tinymce.$;</script>';
}

/**
 * Whether the current editor contains a classic block instance.
 *
 * @return bool True if the editor contains a classic block, false otherwse.
 */
function gutenberg_current_content_contains_classic_block() {
	if ( ! is_admin() ) {
		return false;
	}

	// Handle the post editor.
	if ( ! empty( $_GET['post'] ) && ! empty( $_GET['action'] ) && 'edit' === $_GET['action'] ) {
		$content = get_post( intval( $_GET['post'] ) )->post_content;
	}

	// @TODO the rest of the editors.

	if ( empty( $content ) ) {
		return false;
	}

	$parsed_blocks = parse_blocks( $content );
	foreach ( $parsed_blocks as $block ) {
		if ( empty( $block['blockName'] ) && ! empty( trim( $block['innerHTML'] ) ) ) {
			return true;
		}
	}

	return false;
}

// add_action( 'admin_footer', 'gutenberg_test_tinymce_access' ); // Uncomment the following line to force an external TinyMCE usage.
