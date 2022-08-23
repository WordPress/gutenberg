<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Returns whether list v2 is enabled by the user.
 *
 * @return boolean
 */
function gutenberg_is_list_v2_enabled() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	return $gutenberg_experiments && array_key_exists( 'gutenberg-list-v2', $gutenberg_experiments );
}

/**
 * Sets a global JS variable used to trigger the availability of the experimental blocks.
 */
function gutenberg_enable_experimental_blocks() {
	if ( gutenberg_is_list_v2_enabled() ) {
		wp_add_inline_script( 'wp-block-library', 'window.__experimentalEnableListBlockV2 = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_experimental_blocks' );
