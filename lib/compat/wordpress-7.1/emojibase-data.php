<?php
/**
 * Exposes a same-origin URL for the bundled Emojibase data so the
 * editor's emoji picker (used by the Notes feature) can fetch its
 * dataset without contacting an external CDN and without inflating the
 * editor JS bundle.
 *
 * The data files are copied into `build/emojibase-data/{locale}/` at
 * plugin build time by `tools/build-scripts/copy-emojibase-data.mjs`.
 *
 * @package gutenberg
 * @since   7.1.0
 */

/**
 * Injects the Emojibase dataset URL and per-emoji label overrides into
 * the block editor settings, where the Notes emoji picker in
 * `@wordpress/editor` reads them (`noteEmojibaseUrl` and
 * `noteEmojiLabelOverrides`). Using the settings pipeline (rather than
 * a page global) keeps the configuration scoped to the editor and
 * gives npm consumers of the editor package the same documented
 * boundary: provide the settings, get the full picker.
 *
 * @since 7.1.0
 *
 * @param array $settings Existing block editor settings.
 * @return array Updated block editor settings.
 */
function gutenberg_add_emojibase_settings( $settings ) {
	$settings['noteEmojibaseUrl']        = gutenberg_url( 'build/emojibase-data' );
	$settings['noteEmojiLabelOverrides'] = gutenberg_get_emoji_picker_label_overrides();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_emojibase_settings' );

/**
 * Convert an emoji character to the uppercase hex code-point sequence
 * Emojibase uses as its `hexcode` key. Strips Variation Selector-16
 * (U+FE0F) so qualified and unqualified presentations collapse to the
 * same key, matching Emojibase's own normalization.
 *
 * Decodes UTF-8 byte-by-byte rather than via `mb_ord()`: the `mbstring`
 * extension is recommended but not required by WordPress, and the
 * WordPress compatibility layer does not polyfill `mb_ord()` on all
 * supported versions. Returns an empty string for invalid UTF-8.
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
	$length = strlen( $emoji );
	$parts  = array();
	for ( $i = 0; $i < $length; ) {
		$byte = ord( $emoji[ $i ] );
		if ( $byte < 0x80 ) {
			$codepoint = $byte;
			$size      = 1;
		} elseif ( 0xC0 === ( $byte & 0xE0 ) ) {
			$codepoint = $byte & 0x1F;
			$size      = 2;
		} elseif ( 0xE0 === ( $byte & 0xF0 ) ) {
			$codepoint = $byte & 0x0F;
			$size      = 3;
		} elseif ( 0xF0 === ( $byte & 0xF8 ) ) {
			$codepoint = $byte & 0x07;
			$size      = 4;
		} else {
			return '';
		}
		for ( $j = 1; $j < $size; $j++ ) {
			if ( $i + $j >= $length || 0x80 !== ( ord( $emoji[ $i + $j ] ) & 0xC0 ) ) {
				return '';
			}
			$codepoint = ( $codepoint << 6 ) | ( ord( $emoji[ $i + $j ] ) & 0x3F );
		}
		$i += $size;
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
 * Builds the per-emoji label override map exposed to the editor's
 * emoji picker.
 *
 * Emojibase ships translated labels for 28 locales; for the long tail
 * of WordPress-supported locales, those labels stay in English. The
 * filter below lets sites and plugins fill the gap on a per-emoji
 * basis (typically for the small set of emojis they care about most).
 * The map is keyed by uppercase Emojibase hex codes so it merges
 * cleanly over the per-locale `data.json`.
 *
 * Seeded with the curated reaction emojis so the full picker shows
 * the same translated label as the curated quick-row.
 *
 * @since 7.1.0
 *
 * @return array Map of `hexcode => translated label`.
 */
function gutenberg_get_emoji_picker_label_overrides() {
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
	return array_filter( $overrides, 'is_string' );
}
