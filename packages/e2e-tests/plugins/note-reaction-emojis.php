<?php
/**
 * Plugin Name: Gutenberg Test Note Reaction Emojis
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-note-reaction-emojis
 */

/**
 * Swaps the eyes reaction for a unicorn through the
 * `gutenberg_note_reaction_emojis` filter.
 *
 * @param array[] $emojis The default reaction emoji.
 * @return array[] The filtered reaction emoji.
 */
function gutenberg_test_note_reaction_emojis( $emojis ) {
	$emojis   = array_values(
		array_filter(
			$emojis,
			static function ( $emoji ) {
				return '1f440' !== $emoji['hexKey'];
			}
		)
	);
	$emojis[] = array(
		'hexKey' => '1f984',
		'label'  => 'unicorn',
	);
	return $emojis;
}
add_filter( 'gutenberg_note_reaction_emojis', 'gutenberg_test_note_reaction_emojis' );
