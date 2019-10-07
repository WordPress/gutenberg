<?php

if ( ! has_action( 'admin_enqueue_scripts', 'gutenberg_admin_enqueue_scripts_block_directory' ) ) {
	/**
	 * Function responsible for enqueuing the assets required
	 * for the block directory functionality on the editor.
	 */
	function gutenberg_admin_enqueue_scripts_block_directory() {
		if ( ! gutenberg_is_experiment_enabled( 'gutenberg-block-directory' ) ) {
			return;
		}

		wp_enqueue_script( 'wp-block-directory' );
		wp_enqueue_style( 'wp-block-directory' );
	}
	add_action( 'admin_enqueue_scripts', 'gutenberg_admin_enqueue_scripts_block_directory', 5 );
}
