<?php
/**
 * Plugin Name: Gutenberg Test Note Emojibase Unavailable
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-note-emojibase-unavailable
 */

/**
 * Drops the Emojibase dataset URL from the block editor settings, the
 * way a site that does not serve the dataset looks to the editor. The
 * add-reaction button then offers the curated quick row instead of the
 * full searchable picker, which is the fallback this exercises.
 *
 * Runs late so it wins over `gutenberg_add_emojibase_settings()`.
 *
 * @param array $settings Existing block editor settings.
 * @return array Updated block editor settings.
 */
function gutenberg_test_remove_emojibase_url( $settings ) {
	unset( $settings['noteEmojibaseUrl'] );
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_test_remove_emojibase_url', 20 );
