<?php
/**
 * Block comments compatibility for WordPress 7.0.
 *
 * @package gutenberg
 */

/**
 * Returns the default emoji list for note reactions, filterable via the
 * 'note_reaction_emojis' hook.
 *
 * Each emoji definition requires:
 *   - 'emoji' (string) The emoji character.
 *   - 'label' (string) Human-readable label.
 *   - 'value' (string) Storage slug used as the database key.
 *
 * @since 7.0.0
 *
 * @return array[] Array of emoji definitions.
 */
function gutenberg_get_note_reaction_emojis() {
	$default_emojis = array(
		array(
			'emoji' => '❤️',
			'label' => __( 'Heart', 'gutenberg' ),
			'value' => 'heart',
		),
		array(
			'emoji' => '🎉',
			'label' => __( 'Celebration', 'gutenberg' ),
			'value' => 'celebration',
		),
		array(
			'emoji' => '😄',
			'label' => __( 'Smile', 'gutenberg' ),
			'value' => 'smile',
		),
		array(
			'emoji' => '👀',
			'label' => __( 'Eyes', 'gutenberg' ),
			'value' => 'eyes',
		),
		array(
			'emoji' => '🚀',
			'label' => __( 'Rocket', 'gutenberg' ),
			'value' => 'rocket',
		),
	);

	/**
	 * Filters the list of emoji available for note reactions.
	 *
	 * Each emoji requires an 'emoji' (character), 'label' (human-readable),
	 * and 'value' (storage slug).
	 *
	 * @since 7.0.0
	 *
	 * @param array[] $emojis Array of emoji definitions.
	 */
	return apply_filters( 'note_reaction_emojis', $default_emojis );
}
