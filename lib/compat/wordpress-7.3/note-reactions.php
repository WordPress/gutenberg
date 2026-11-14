<?php
/**
 * Filterable list of note reaction emoji for WordPress 7.3.
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
 * Returns the emoji a note can be reacted with.
 *
 * @since 7.3.0
 *
 * @return array[] {
 *     The emoji, in display order.
 *
 *     @type array ...$0 {
 *         @type string $hex_key The emoji's hex key, eg. `2764`.
 *         @type string $label   The emoji's name, lowercase, eg. `heart`.
 *     }
 * }
 *
 * @phpstan-return list<array{ hex_key: lowercase-string&non-empty-string, label: string }>
 */
function gutenberg_get_note_reaction_emojis(): array {
	// Labels are lowercase since they also appear mid-sentence, eg. in the
	// reaction pill's tooltip.
	$default_emojis = array(
		array(
			'hex_key' => '1f44d',
			'label'   => _x( 'thumbs up', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hex_key' => '2795',
			'label'   => _x( 'plus', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hex_key' => '2764',
			'label'   => _x( 'heart', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hex_key' => '1f389',
			'label'   => _x( 'celebration', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hex_key' => '1f604',
			'label'   => _x( 'smile', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hex_key' => '1f440',
			'label'   => _x( 'eyes', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hex_key' => '1f680',
			'label'   => _x( 'rocket', 'emoji reaction', 'gutenberg' ),
		),
	);

	/**
	 * Filters the emoji a note can be reacted with.
	 *
	 * Add entries to offer more emoji, or remove them to offer fewer. An
	 * empty list turns off adding reactions; existing reactions still show
	 * and can be removed by their authors.
	 *
	 * Each emoji is identified by its hex key: its code points in hex,
	 * joined by `-` (eg. `1f984` for 🦄, `1f468-200d-1f4bb` for 👨‍💻).
	 * U+FE0F is dropped and case does not matter. The editor renders each
	 * emoji as text, so pick emoji the fonts on your users' systems can
	 * display: newer emoji and flags do not render everywhere.
	 *
	 * @since 7.3.0
	 *
	 * @param array[] $emojis {
	 *     The emoji to offer, in display order.
	 *
	 *     @type array ...$0 {
	 *         @type string $hex_key The emoji's hex key, eg. `1f984`.
	 *         @type string $label   The emoji's name, lowercase, eg. `unicorn`.
	 *     }
	 * }
	 */
	$emojis = apply_filters( 'wp_note_reaction_emojis', $default_emojis );

	if ( ! is_array( $emojis ) ) {
		return $default_emojis;
	}

	// Drop malformed entries and duplicate keys, keeping the first label.
	$sanitized = array();
	foreach ( $emojis as $emoji ) {
		if ( ! is_array( $emoji ) || ! isset( $emoji['hex_key'], $emoji['label'] ) || ! is_string( $emoji['label'] ) ) {
			continue;
		}

		$hex_key = gutenberg_normalize_note_reaction_key( $emoji['hex_key'] );
		$label   = sanitize_text_field( $emoji['label'] );
		if ( '' === $hex_key || '' === $label || isset( $sanitized[ $hex_key ] ) ) {
			continue;
		}

		$sanitized[ $hex_key ] = array(
			'hex_key' => $hex_key,
			'label'   => $label,
		);
	}

	return array_values( $sanitized );
}

/**
 * Returns the hex keys of the emoji a note reaction accepts.
 *
 * Each key is the emoji's lowercase code points, padded to four digits.
 *
 * @since 7.3.0
 *
 * @return string[] The keys of the emoji from `gutenberg_get_note_reaction_emojis()`.
 *
 * @phpstan-return list<lowercase-string&non-empty-string>
 */
function gutenberg_get_note_reaction_keys(): array {
	return array_column( gutenberg_get_note_reaction_emojis(), 'hex_key' );
}

/**
 * Passes the reaction emoji to the editor, so the reaction menu offers the
 * same emoji the REST API accepts.
 *
 * The `noteReactionEmojis` setting is internal and may change: extend the
 * list through the `wp_note_reaction_emojis` filter instead.
 *
 * @since 7.3.0
 *
 * @param array $settings Block editor settings.
 * @return array Block editor settings with `noteReactionEmojis` added.
 *
 * @phpstan-param array<string, mixed> $settings
 * @phpstan-return array<string, mixed>
 */
function gutenberg_add_note_reaction_emojis_setting( $settings ): array {
	$settings['noteReactionEmojis'] = gutenberg_get_note_reaction_emojis();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_note_reaction_emojis_setting' );
