<?php
/**
 * Plugin Name: Gutenberg Test Note Reaction Emojis
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-note-reaction-emojis
 */

/**
 * Extends the note reaction emoji list with many extra entries to
 * exercise the `gutenberg_note_reaction_emojis` filter end-to-end:
 * the picker must offer the extended set, the REST API must accept
 * the custom slugs, and the picker UI must stay usable at this size.
 *
 * @param array[] $emojis Default emoji definitions.
 * @return array[] Extended emoji definitions.
 */
function gutenberg_test_note_reaction_emojis( $emojis ) {
	$extra = array(
		array(
			'emoji' => '👍',
			'label' => 'Thumbs up',
			'value' => 'thumbs-up',
		),
		array(
			'emoji' => '👎',
			'label' => 'Thumbs down',
			'value' => 'thumbs-down',
		),
		array(
			'emoji' => '🔥',
			'label' => 'Fire',
			'value' => 'fire',
		),
		array(
			'emoji' => '⭐',
			'label' => 'Star',
			'value' => 'star',
		),
		array(
			'emoji' => '👏',
			'label' => 'Clap',
			'value' => 'clap',
		),
		array(
			'emoji' => '😂',
			'label' => 'Joy',
			'value' => 'joy',
		),
		array(
			'emoji' => '😢',
			'label' => 'Cry',
			'value' => 'cry',
		),
		array(
			'emoji' => '😮',
			'label' => 'Wow',
			'value' => 'wow',
		),
		array(
			'emoji' => '🤔',
			'label' => 'Thinking',
			'value' => 'thinking',
		),
		array(
			'emoji' => '🙏',
			'label' => 'Pray',
			'value' => 'pray',
		),
		array(
			'emoji' => '💯',
			'label' => 'Hundred',
			'value' => 'hundred',
		),
		array(
			'emoji' => '🎈',
			'label' => 'Balloon',
			'value' => 'balloon',
		),
		array(
			'emoji' => '🍕',
			'label' => 'Pizza',
			'value' => 'pizza',
		),
		array(
			'emoji' => '🌈',
			'label' => 'Rainbow',
			'value' => 'rainbow',
		),
		array(
			'emoji' => '⚡',
			'label' => 'Lightning',
			'value' => 'lightning',
		),
		array(
			'emoji' => '🐛',
			'label' => 'Bug',
			'value' => 'bug',
		),
		array(
			'emoji' => '🚢',
			'label' => 'Ship',
			'value' => 'ship',
		),
		array(
			'emoji' => '🧠',
			'label' => 'Brain',
			'value' => 'brain',
		),
		array(
			'emoji' => '🦄',
			'label' => 'Unicorn',
			'value' => 'unicorn',
		),
		array(
			'emoji' => '🏆',
			'label' => 'Trophy',
			'value' => 'trophy',
		),
	);

	return array_merge( $emojis, $extra );
}
add_filter( 'gutenberg_note_reaction_emojis', 'gutenberg_test_note_reaction_emojis' );
