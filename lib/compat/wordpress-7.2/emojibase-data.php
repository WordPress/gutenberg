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
	$settings['noteEmojibaseUrl']        = gutenberg_url( 'build/emojibase-data' );
	$settings['noteEmojiLabelOverrides'] = gutenberg_get_emoji_picker_label_overrides();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_emojibase_settings' );

/**
 * Convert an emoji character to Emojibase's uppercase `hexcode` form:
 * Variation Selector-16 stripped and each code point padded to four
 * digits (`00A9`, not `A9`).
 *
 * Decodes UTF-8 by hand because `mbstring` is recommended but not
 * required by WordPress, and `mb_ord()` is not polyfilled on all
 * supported versions.
 *
 * @since 7.2.0
 *
 * @param string $emoji Emoji character.
 * @return string Uppercase four-digit-padded hex code-points joined by
 *                `-`, or empty string.
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
		$parts[] = str_pad( strtoupper( dechex( $codepoint ) ), 4, '0', STR_PAD_LEFT );
	}
	return implode( '-', $parts );
}

/**
 * Builds the per-emoji label override map exposed to the editor's picker.
 *
 * Emojibase translates labels for 28 locales only; the filter below lets
 * sites fill the gap for the emojis they care about. Seeded with the
 * curated reactions so both rows show the same label.
 *
 * @since 7.2.0
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

	// A non-string label would crash `label.toLowerCase()` in searchEmojis().
	$overrides = is_array( $overrides ) ? $overrides : array();
	return array_filter( $overrides, 'is_string' );
}
