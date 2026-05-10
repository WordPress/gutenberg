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

/**
 * Convert an emoji character to the uppercase hex code-point sequence
 * Emojibase uses as its `hexcode` key. Strips Variation Selector-16
 * (U+FE0F) so qualified and unqualified presentations collapse to the
 * same key, matching Emojibase's own normalization.
 *
 * @since 7.1.0
 *
 * @param string $emoji Emoji character.
 * @return string Uppercase hex code-points joined by `-`, or empty string.
 */
function gutenberg_emoji_to_hexcode( $emoji ) {
	if ( ! is_string( $emoji ) || '' === $emoji ) {
		return '';
	}
	$length = mb_strlen( $emoji, 'UTF-8' );
	$parts  = array();
	for ( $i = 0; $i < $length; $i++ ) {
		$char      = mb_substr( $emoji, $i, 1, 'UTF-8' );
		$codepoint = mb_ord( $char, 'UTF-8' );
		// Skip Variation Selector-16 so qualified `❤️` (2764 FE0F)
		// matches Emojibase's unqualified `2764` entry.
		if ( 0xFE0F === $codepoint ) {
			continue;
		}
		$parts[] = strtoupper( dechex( $codepoint ) );
	}
	return implode( '-', $parts );
}

/**
 * Exposes a per-emoji label override map to the editor's emoji picker.
 *
 * Emojibase ships translated labels for 28 locales; for the long tail
 * of WordPress-supported locales, those labels stay in English. This
 * filter lets sites and plugins fill the gap on a per-emoji basis
 * (typically for the small set of emojis they care about most). The
 * map is keyed by uppercase Emojibase hex codes so it merges cleanly
 * over the per-locale `data.json`.
 *
 * Seeded with the curated reaction emojis so the full picker shows
 * the same translated label as the curated quick-row.
 *
 * @since 7.1.0
 */
function gutenberg_emoji_picker_label_overrides_register_inline_script() {
	$defaults = array();
	if ( function_exists( 'gutenberg_get_note_reaction_emojis' ) ) {
		foreach ( gutenberg_get_note_reaction_emojis() as $entry ) {
			if ( empty( $entry['emoji'] ) || empty( $entry['label'] ) ) {
				continue;
			}
			$hex = gutenberg_emoji_to_hexcode( $entry['emoji'] );
			if ( '' !== $hex ) {
				$defaults[ $hex ] = $entry['label'];
			}
		}
	}

	/**
	 * Filters the emoji label overrides exposed to the Notes picker.
	 *
	 * Use this to translate emoji labels for locales the upstream
	 * Emojibase dataset has not translated yet, or to override the
	 * default label for specific emojis. Map keys are uppercase hex
	 * code-point sequences with U+FE0F stripped (matching Emojibase's
	 * own `hexcode` field).
	 *
	 * @since 7.1.0
	 *
	 * @param array $overrides Map of `hexcode => translated label`.
	 */
	$overrides = apply_filters(
		'gutenberg_emoji_picker_label_overrides',
		$defaults
	);

	// Coerce defensively: a misbehaving filter callback that returns
	// non-string values would otherwise crash the picker's JS-side
	// label handling (`label.toLowerCase()` in searchEmojis()).
	$overrides = is_array( $overrides ) ? $overrides : array();
	$overrides = array_filter( $overrides, 'is_string' );

	wp_add_inline_script(
		'wp-editor',
		'window.gutenbergEmojiLabelOverrides = ' . wp_json_encode( (object) $overrides ) . ';',
		'before'
	);
}
add_action( 'init', 'gutenberg_emoji_picker_label_overrides_register_inline_script' );
