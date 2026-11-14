<?php
/**
 * Plugin Name: Gutenberg Test Note Reaction Emojis Many
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-note-reaction-emojis-many
 */

/**
 * Adds 100 animal and face emoji through the `wp_note_reaction_emojis` filter.
 *
 * @param array[] $emojis The default reaction emoji.
 * @return array[] The filtered reaction emoji.
 */
function gutenberg_test_note_reaction_emojis_many( $emojis ) {
	$code_points = array_merge( range( 0x1f400, 0x1f43e ), range( 0x1f605, 0x1f62b ) );
	foreach ( array_slice( $code_points, 0, 100 ) as $index => $code_point ) {
		$emojis[] = array(
			'hex_key' => dechex( $code_point ),
			'label'   => 'extra ' . ( $index + 1 ),
		);
	}
	return $emojis;
}
add_filter( 'wp_note_reaction_emojis', 'gutenberg_test_note_reaction_emojis_many' );
