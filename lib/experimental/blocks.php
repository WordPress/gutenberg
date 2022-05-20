<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Returns whether the quote v2 is enabled by the user.
 *
 * @return boolean
 */
function gutenberg_is_quote_v2_enabled() {
	return get_option( 'gutenberg-experiments' ) && array_key_exists( 'gutenberg-quote-v2', get_option( 'gutenberg-experiments' ) );
}

/**
 * Sets a global JS variable used to trigger the availability of the experimental blocks.
 */
function gutenberg_enable_experimental_blocks() {
	if ( get_option( 'gutenberg-experiments' ) && array_key_exists( 'gutenberg-list-v2', get_option( 'gutenberg-experiments' ) ) ) {
		wp_add_inline_script( 'wp-block-library', 'window.__experimentalEnableListBlockV2 = true', 'before' );
	}

	if ( gutenberg_is_quote_v2_enabled() ) {
		wp_add_inline_script( 'wp-block-library', 'window.__experimentalEnableQuoteBlockV2 = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_experimental_blocks' );
