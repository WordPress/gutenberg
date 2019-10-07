<?php

if ( ! has_action( 'admin_enqueue_scripts', 'gutenberg_aenqueue_block_editor_assets_block_directory' ) ) {
	/**
	 * Function responsible for enqueuing the assets required
	 * for the block directory functionality in the editor.
	 */
	function gutenberg_enqueue_block_editor_assets_block_directory() {
		if ( ! gutenberg_is_experiment_enabled( 'gutenberg-block-directory' ) ) {
			return;
		}

		wp_enqueue_script( 'wp-block-directory' );
		wp_enqueue_style( 'wp-block-directory' );
	}
	add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_block_editor_assets_block_directory' );
}
