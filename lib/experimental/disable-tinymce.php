<?php
/**
 * Experiment to disable the Classic block.
 *
 * @package gutenberg
 */

/**
 * Render a variable that we'll use to declare that the editor will need the classic block.
 */
function gutenberg_declare_classic_block_necessary() {
	if ( ! gutenberg_post_being_edited_requires_classic_block() ) {
		return;
	}
	echo '<script type="text/javascript">window.wp.needsClassicBlock = true;</script>';
}
add_action( 'admin_print_footer_scripts', 'gutenberg_declare_classic_block_necessary', 20 );

/**
 * Whether the current editor contains a classic block instance.
 *
 * @return bool True if the editor contains a classic block, false otherwise.
 */
function gutenberg_post_being_edited_requires_classic_block() {
	if ( ! is_admin() ) {
		return false;
	}

	// Continue only if we're in the post editor.
	if ( empty( $_GET['post'] ) || empty( $_GET['action'] ) || 'edit' !== $_GET['action'] ) {
		return false;
	}

	// Bail if for some reason the post isn't found.
	$current_post = get_post( absint( $_GET['post'] ) );
	if ( ! $current_post ) {
		return false;
	}

	// Check if block editor is disabled by "Classic Editor" or another plugin.
	if (
		function_exists( 'use_block_editor_for_post_type' ) &&
		! use_block_editor_for_post_type( $current_post->post_type )
	) {
		return true;
	}

	$content = $current_post->post_content;
	if ( empty( $content ) ) {
		return false;
	}

	$parsed_blocks = parse_blocks( $content );
	foreach ( $parsed_blocks as $block ) {
		$is_freeform_block = empty( $block['blockName'] ) || 'core/freeform' === $block['blockName'];
		if ( $is_freeform_block && strlen( trim( $block['innerHTML'] ) ) > 0 ) {
			return true;
		}
	}

	return false;
}
