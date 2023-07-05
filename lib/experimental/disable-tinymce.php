<?php
/**
 * Experiment to disable TinyMCE and the Classic block.
 *
 * @package gutenberg
 */

// add_action( 'admin_footer', 'gutenberg_test_tinymce_access' ); // Uncomment the following line to force an external TinyMCE usage.

/**
 * Render a variable that we'll use to declare that the editor will need the classic block.
 */
function gutenberg_declare_classic_block_necessary() {
	if ( ! gutenberg_post_being_edited_requires_classic_block() ) {
		return;
	}
	echo '<script type="text/javascript">window.wp.needsClassicBlock = true;</script>';
}
add_action( 'admin_footer', 'gutenberg_declare_classic_block_necessary' );

// If user has already requested TinyMCE, we're ending the experiment.
if ( ! empty( $_GET['requiresTinymce'] ) || gutenberg_post_being_edited_requires_classic_block() ) {
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
 * Example TinyMCE usage used for testing.
 * Uncomment line 8 in this file to enable.
 */
function gutenberg_test_tinymce_access() {
	echo '<script type="text/javascript">const a = window.tinymce.$;</script>';
}

/**
 * Whether the current editor contains a classic block instance.
 *
 * @return bool True if the editor contains a classic block, false otherwse.
 */
function gutenberg_post_being_edited_requires_classic_block() {
	if ( ! is_admin() ) {
		return false;
	}

	// Handle the post editor.
	if ( ! empty( $_GET['post'] ) && ! empty( $_GET['action'] ) && 'edit' === $_GET['action'] ) {
		$current_post = get_post( intval( $_GET['post'] ) );
		if ( ! $current_post || is_wp_error( $current_post ) ) {
			return false;
		}

		$content = $current_post->post_content;
	}

	if ( empty( $content ) ) {
		return false;
	}

	$parsed_blocks = parse_blocks( $content );
	foreach ( $parsed_blocks as $block ) {
		if ( empty( $block['blockName'] ) && strlen( trim( $block['innerHTML'] ) ) > 0 ) {
			return true;
		}
	}

	return false;
}
