<?php
/**
 * Utilities to manage editor settings.
 *
 * @package gutenberg
 */

/**
 * Sets a global JS variable used to trigger the availability of each Gutenberg Experiment.
 */
function gutenberg_enable_experiments() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-sync-collaboration', $gutenberg_experiments ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableSync = true', 'before' );
	}
	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-zoomed-out-view', $gutenberg_experiments ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableZoomedOutView = true', 'before' );
	}
	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-color-randomizer', $gutenberg_experiments ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableColorRandomizer = true', 'before' );
	}
	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-group-grid-variation', $gutenberg_experiments ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableGroupGridVariation = true', 'before' );
	}

	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-connections', $gutenberg_experiments ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalConnections = true', 'before' );
	}

	if ( gutenberg_is_experiment_enabled( 'gutenberg-no-tinymce' ) ) {
		wp_add_inline_script( 'wp-block-library', 'window.__experimentalDisableTinymce = true', 'before' );
	}

	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-block-hooks', $gutenberg_experiments ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalBlockHooks = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_experiments' );
