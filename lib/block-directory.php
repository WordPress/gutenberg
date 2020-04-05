<?php
/**
 * Block directory functions.
 *
 * @package gutenberg
 */

if (
	gutenberg_is_experiment_enabled( 'gutenberg-block-directory' ) &&
	! has_action( 'admin_enqueue_scripts', 'enqueue_block_editor_assets_block_directory' )
) {
	/**
	 * Function responsible for enqueuing the assets required
	 * for the block directory functionality in the editor.
	 */
	function gutenberg_enqueue_block_editor_assets_block_directory() {
		wp_enqueue_script( 'wp-block-directory' );
		wp_enqueue_style( 'wp-block-directory' );
	}
	add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_block_editor_assets_block_directory' );
}
