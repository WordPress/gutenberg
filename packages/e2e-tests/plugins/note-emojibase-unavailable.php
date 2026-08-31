<?php
/**
 * Plugin Name: Gutenberg Test Note Emojibase Unavailable
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-note-emojibase-unavailable
 */

/**
 * Drops the Emojibase dataset URL so the editor falls back to the curated
 * quick row. Runs late to win over `gutenberg_add_emojibase_settings()`.
 *
 * @param array $settings Existing block editor settings.
 * @return array Updated block editor settings.
 */
function gutenberg_test_remove_emojibase_url( $settings ) {
	unset( $settings['noteEmojibaseUrl'] );
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_test_remove_emojibase_url', 20 );
