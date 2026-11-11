<?php
/**
 * Filters for the emoji note reactions offer and accept, for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Normalizes an emoji hex key to the form reactions are stored under.
 *
 * Lowercases the code points, pads each to four digits and drops U+FE0F, so
 * `2764-FE0F`, `2764` and `2764-fe0f` all become `2764`.
 *
 * @since 7.3.0
 *
 * @param mixed $hex_key The key to normalize.
 * @return string The normalized key, or an empty string when it is not a
 *                sequence of valid Unicode code points.
 *
 * @phpstan-return lowercase-string
 */
function gutenberg_normalize_note_reaction_key( $hex_key ): string {
	if ( ! is_string( $hex_key ) || ! preg_match( '/^[0-9a-f]{1,6}(?:-[0-9a-f]{1,6})*$/i', $hex_key ) ) {
		return '';
	}

	$code_points = array();
	foreach ( explode( '-', strtolower( $hex_key ) ) as $code_point ) {
		$value = (int) hexdec( $code_point );
		// Surrogates and values past U+10FFFF are not code points.
		if ( $value > 0x10FFFF || ( $value >= 0xD800 && $value <= 0xDFFF ) ) {
			return '';
		}
		if ( 0xFE0F === $value ) {
			continue;
		}
		$code_points[] = str_pad( ltrim( $code_point, '0' ), 4, '0', STR_PAD_LEFT );
	}

	return implode( '-', $code_points );
}

/**
 * Reduces an emoji hex key to its base emoji: normalized, with skin-tone
 * modifiers dropped, so a rule for an emoji covers its skin-tone variants.
 *
 * @since 7.3.0
 *
 * @param mixed $hex_key The key to reduce.
 * @return string The base emoji's key, or an empty string when invalid.
 *
 * @phpstan-return lowercase-string
 */
function gutenberg_get_note_reaction_base_key( $hex_key ): string {
	$normalized = gutenberg_normalize_note_reaction_key( $hex_key );
	if ( '' === $normalized ) {
		return '';
	}

	$code_points = array();
	foreach ( explode( '-', $normalized ) as $code_point ) {
		$value = (int) hexdec( $code_point );
		// The five Fitzpatrick skin-tone modifiers.
		if ( $value >= 0x1F3FB && $value <= 0x1F3FF ) {
			continue;
		}
		$code_points[] = $code_point;
	}

	return implode( '-', $code_points );
}

/**
 * Returns the note reaction emoji settings: the named emoji, plus the rules
 * for which other emoji the picker offers and the REST API accepts.
 *
 * @since 7.3.0
 *
 * @return array {
 *     @type array[] $emojis {
 *         Named emoji, in display order.
 *
 *         @type array ...$0 {
 *             @type string $hex_key The emoji's hex key, eg. `2764`.
 *             @type string $label   The emoji's name, eg. `Heart`.
 *         }
 *     }
 *     @type bool     $allow_unlisted Whether emoji outside the named list are accepted.
 *     @type string[] $exclude        Hex keys of base emoji that are never accepted.
 * }
 *
 * @phpstan-return array{
 *     emojis: list<array{ hex_key: lowercase-string&non-empty-string, label: string }>,
 *     allow_unlisted: bool,
 *     exclude: list<lowercase-string&non-empty-string>,
 * }
 */
function gutenberg_get_note_reaction_emoji_settings(): array {
	$defaults = array(
		'emojis'         => array(
			array(
				'hex_key' => '1f44d',
				'label'   => _x( 'Thumbs up', 'emoji reaction', 'gutenberg' ),
			),
			array(
				'hex_key' => '2795',
				'label'   => _x( 'Plus', 'emoji reaction', 'gutenberg' ),
			),
			array(
				'hex_key' => '2764',
				'label'   => _x( 'Heart', 'emoji reaction', 'gutenberg' ),
			),
			array(
				'hex_key' => '1f389',
				'label'   => _x( 'Celebration', 'emoji reaction', 'gutenberg' ),
			),
			array(
				'hex_key' => '1f604',
				'label'   => _x( 'Smile', 'emoji reaction', 'gutenberg' ),
			),
			array(
				'hex_key' => '1f440',
				'label'   => _x( 'Eyes', 'emoji reaction', 'gutenberg' ),
			),
			array(
				'hex_key' => '1f680',
				'label'   => _x( 'Rocket', 'emoji reaction', 'gutenberg' ),
			),
		),
		'allow_unlisted' => true,
		'exclude'        => array(),
	);

	/**
	 * Filters which emoji note reactions offer and accept.
	 *
	 * Named emoji seed the picker's "Frequently used" section, carry their
	 * own labels, and are always accepted. `allow_unlisted` and `exclude`
	 * apply to every other emoji in the picker.
	 *
	 * Each emoji is identified by its hex key: its code points in hex,
	 * joined by `-` (eg. `1f984` for 🦄, `1f468-200d-1f4bb` for 👨‍💻).
	 * U+FE0F is dropped and case does not matter, so an Emojibase hexcode
	 * such as `2764-FE0F` works as is.
	 *
	 * @since 7.3.0
	 *
	 * @param array $settings {
	 *     @type array[] $emojis {
	 *         Named emoji, in display order.
	 *
	 *         @type array ...$0 {
	 *             @type string $hex_key The emoji's hex key, eg. `1f984`.
	 *             @type string $label   The emoji's name, eg. `Unicorn`.
	 *         }
	 *     }
	 *     @type bool     $allow_unlisted Whether any emoji from the picker is
	 *                                    accepted. False limits reactions to the
	 *                                    named list. Default true.
	 *     @type string[] $exclude        Hex keys to reject, eg. `1f595`.
	 *                                    Excluding an emoji also excludes its
	 *                                    skin-tone variants and any sequence
	 *                                    that contains it. Default empty.
	 * }
	 */
	$settings = apply_filters( 'gutenberg_note_reaction_emoji_settings', $defaults );
	if ( ! is_array( $settings ) ) {
		$settings = $defaults;
	}

	// Keys a callback leaves out keep their defaults.
	$named_emojis   = $settings['emojis'] ?? $defaults['emojis'];
	$excluded_keys  = $settings['exclude'] ?? $defaults['exclude'];
	$allow_unlisted = (bool) ( $settings['allow_unlisted'] ?? $defaults['allow_unlisted'] );

	// Drop malformed entries and duplicate keys, keeping the first label.
	$emojis = array();
	if ( is_array( $named_emojis ) ) {
		foreach ( $named_emojis as $emoji ) {
			if ( ! is_array( $emoji ) || ! isset( $emoji['hex_key'], $emoji['label'] ) || ! is_string( $emoji['label'] ) ) {
				continue;
			}

			$hex_key = gutenberg_normalize_note_reaction_key( $emoji['hex_key'] );
			$label   = sanitize_text_field( $emoji['label'] );
			if ( '' === $hex_key || '' === $label || isset( $emojis[ $hex_key ] ) ) {
				continue;
			}

			$emojis[ $hex_key ] = array(
				'hex_key' => $hex_key,
				'label'   => $label,
			);
		}
	}

	$exclude = array();
	if ( is_array( $excluded_keys ) ) {
		foreach ( $excluded_keys as $hex_key ) {
			$base_key = gutenberg_get_note_reaction_base_key( $hex_key );
			if ( '' !== $base_key ) {
				$exclude[ $base_key ] = $base_key;
			}
		}
	}

	return array(
		'emojis'         => array_values( $emojis ),
		'allow_unlisted' => $allow_unlisted,
		'exclude'        => array_values( $exclude ),
	);
}

/**
 * Whether a reaction hex key is accepted under the emoji rules. An emoji
 * from the named list is always accepted, including its skin-tone variants.
 * An excluded emoji is rejected on its own and inside a longer sequence.
 *
 * @since 7.3.0
 *
 * @param mixed $hex_key The submitted hex key.
 * @return bool Whether the reaction is allowed.
 */
function gutenberg_is_note_reaction_key_allowed( $hex_key ): bool {
	$base_key = gutenberg_get_note_reaction_base_key( $hex_key );
	if ( '' === $base_key ) {
		return false;
	}

	$settings = gutenberg_get_note_reaction_emoji_settings();
	foreach ( $settings['emojis'] as $emoji ) {
		if ( gutenberg_get_note_reaction_base_key( $emoji['hex_key'] ) === $base_key ) {
			return true;
		}
	}

	if ( ! $settings['allow_unlisted'] ) {
		return false;
	}

	/*
	 * An excluded emoji is rejected anywhere in the key, not only as the
	 * whole key: otherwise appending a code point that does not change how
	 * it renders, such as U+FE0E, would get it past the exclusion.
	 */
	foreach ( $settings['exclude'] as $excluded_key ) {
		if ( str_contains( "-{$base_key}-", "-{$excluded_key}-" ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Returns the emoji labels that replace the Emojibase ones in the picker.
 *
 * Emojibase translates labels for 28 locales only, so sites can fill the
 * gap for the emoji they care about. Seeded with the named reactions, so
 * an emoji keeps its named label in the picker.
 *
 * @since 7.3.0
 *
 * @return string[] Map of Emojibase hexcode to label.
 *
 * @phpstan-return array<int|string, string>
 */
function gutenberg_get_emoji_picker_label_overrides(): array {
	$defaults = array();
	foreach ( gutenberg_get_note_reaction_emoji_settings()['emojis'] as $emoji ) {
		$defaults[ strtoupper( $emoji['hex_key'] ) ] = $emoji['label'];
	}

	/**
	 * Filters the emoji label overrides exposed to the Notes picker.
	 *
	 * Keys are uppercase Emojibase `hexcode` values: each code point
	 * zero-padded to four digits with U+FE0F dropped, eg. `2764` for ❤️
	 * and `00A9` for ©️.
	 *
	 * @since 7.3.0
	 *
	 * @param string[] $overrides Map of Emojibase hexcode to label.
	 */
	$overrides = apply_filters( 'gutenberg_emoji_picker_label_overrides', $defaults );

	// A non-string label would crash `override.toLowerCase()` in searchEmojis().
	return is_array( $overrides ) ? array_filter( $overrides, 'is_string' ) : array();
}

/**
 * Passes the reaction emoji settings to the editor, so the picker offers
 * the same emoji the REST API accepts.
 *
 * The settings are internal and may change: customize reactions through
 * the `gutenberg_note_reaction_emoji_settings` and
 * `gutenberg_emoji_picker_label_overrides` filters instead.
 *
 * @since 7.3.0
 *
 * @param array $settings Block editor settings.
 * @return array Block editor settings with the reaction emoji settings added.
 *
 * @phpstan-param array<string, mixed> $settings
 * @phpstan-return array<string, mixed>
 */
function gutenberg_add_note_reaction_emojis_setting( $settings ): array {
	$emoji_settings = gutenberg_get_note_reaction_emoji_settings();

	$settings['noteReactionEmojis']      = $emoji_settings['emojis'];
	$settings['noteReactionEmojiRules']  = array(
		'allowUnlisted' => $emoji_settings['allow_unlisted'],
		'exclude'       => $emoji_settings['exclude'],
	);
	$settings['noteEmojiLabelOverrides'] = gutenberg_get_emoji_picker_label_overrides();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_note_reaction_emojis_setting' );
