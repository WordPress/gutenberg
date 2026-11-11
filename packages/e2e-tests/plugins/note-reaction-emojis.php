<?php
/**
 * Plugin Name: Gutenberg Test Note Reaction Emojis
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-note-reaction-emojis
 */

/**
 * Exercises the `gutenberg_note_reaction_emoji_settings` filter end-to-end:
 * adds named emoji with their own labels, which the picker must offer and
 * the REST API accept, and excludes one the picker must no longer offer.
 *
 * @param array $settings Default emoji settings.
 * @return array Filtered emoji settings.
 *
 * @phpstan-param array{ emojis: list<array{ hex_key: string, label: string }>, allow_unlisted: bool, exclude: list<string> } $settings
 * @phpstan-return array{ emojis: list<array{ hex_key: string, label: string }>, allow_unlisted: bool, exclude: list<string> }
 */
function gutenberg_test_note_reaction_emojis( array $settings ): array {
	$settings['emojis'][] = array(
		'hex_key' => '1f984',
		'label'   => 'Unicorn',
	);
	$settings['emojis'][] = array(
		'hex_key' => '1f3c6',
		'label'   => 'Trophy',
	);
	// Thumbs down, along with its skin-tone variants.
	$settings['exclude'][] = '1f44e';
	return $settings;
}
add_filter( 'gutenberg_note_reaction_emoji_settings', 'gutenberg_test_note_reaction_emojis' );
