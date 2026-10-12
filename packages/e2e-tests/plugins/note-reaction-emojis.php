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
 */
function gutenberg_test_note_reaction_emojis( $settings ) {
	$settings['emojis'][] = array(
		'hexcode' => '1F984',
		'label'   => 'Unicorn',
	);
	$settings['emojis'][] = array(
		'hexcode' => '1F3C6',
		'label'   => 'Trophy',
	);
	// Thumbs down, along with its skin-tone variants.
	$settings['exclude'][] = '1F44E';
	return $settings;
}
add_filter( 'gutenberg_note_reaction_emoji_settings', 'gutenberg_test_note_reaction_emojis' );
