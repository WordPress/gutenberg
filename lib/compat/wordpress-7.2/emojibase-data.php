<?php
/**
 * Exposes a same-origin URL for the bundled Emojibase data, so the Notes
 * emoji picker fetches its dataset without an external CDN.
 *
 * `tools/build-scripts/copy-emojibase-data.mjs` copies the files into
 * `build/emojibase-data/{locale}/` at plugin build time.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Injects the Emojibase dataset URL and per-emoji label overrides into the
 * block editor settings, where the Notes picker reads them. npm consumers
 * of `@wordpress/editor` opt in by supplying the same two settings.
 *
 * @since 7.2.0
 *
 * @param array $settings Existing block editor settings.
 * @return array Updated block editor settings.
 */
function gutenberg_add_emojibase_settings( $settings ) {
	// Without the copied data the picker would 404 on every open.
	if ( is_dir( gutenberg_dir_path() . 'build/emojibase-data' ) ) {
		$settings['noteEmojibaseUrl'] = gutenberg_url( 'build/emojibase-data' );
	}
	$settings['noteEmojiLabelOverrides'] = gutenberg_get_emoji_picker_label_overrides();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_emojibase_settings' );

/**
 * Builds the per-emoji label override map exposed to the editor's picker.
 *
 * Emojibase translates labels for 28 locales only; the filter below lets
 * sites fill the gap for the emojis they care about. Seeded with the
 * named reactions so an emoji keeps its named label in the picker.
 *
 * @since 7.2.0
 *
 * @return array Map of `hexcode => translated label`.
 */
function gutenberg_get_emoji_picker_label_overrides() {
	$defaults = array();
	if ( function_exists( 'gutenberg_get_note_reaction_emoji_settings' ) ) {
		$emoji_settings = gutenberg_get_note_reaction_emoji_settings();
		foreach ( $emoji_settings['emojis'] as $entry ) {
			$defaults[ strtoupper( $entry['hexcode'] ) ] = $entry['label'];
		}
	}

	/**
	 * Filters the emoji label overrides exposed to the Notes picker.
	 *
	 * Keys are uppercase Emojibase `hexcode` values: each code point
	 * zero-padded to four digits with U+FE0F stripped, e.g. `2764` for
	 * ❤️ and `00A9` for ©️.
	 *
	 * @since 7.2.0
	 *
	 * @param array $overrides Map of `hexcode => translated label`.
	 */
	$overrides = apply_filters(
		'gutenberg_emoji_picker_label_overrides',
		$defaults
	);

	// A non-string label would crash `override.toLowerCase()` in searchEmojis().
	$overrides = is_array( $overrides ) ? $overrides : array();
	return array_filter( $overrides, 'is_string' );
}
