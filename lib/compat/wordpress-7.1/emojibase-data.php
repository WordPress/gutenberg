<?php
/**
 * Exposes a same-origin URL for the bundled Emojibase data so the
 * editor's emoji picker (used by the Notes feature) can fetch its
 * dataset without contacting an external CDN and without inflating the
 * editor JS bundle.
 *
 * The data files are copied into `build/emojibase-data/{locale}/` at
 * plugin build time by `bin/copy-emojibase-data.mjs`.
 *
 * @package gutenberg
 * @since   7.1.0
 */

/**
 * Adds a global JS variable pointing at the bundled Emojibase data
 * directory, before any editor script runs. The picker in
 * @wordpress/editor consumes this URL.
 */
function gutenberg_emojibase_data_register_inline_script() {
	$url = gutenberg_url( 'build/emojibase-data' );
	wp_add_inline_script(
		'wp-editor',
		'window.gutenbergEmojibaseUrl = ' . wp_json_encode( $url ) . ';',
		'before'
	);
}
add_action( 'init', 'gutenberg_emojibase_data_register_inline_script' );
