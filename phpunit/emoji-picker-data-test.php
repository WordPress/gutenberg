<?php
/**
 * Tests for the editor emoji picker's PHP-side helpers and filter.
 *
 * @package gutenberg
 */

/**
 * @group emoji-picker
 */
class Emoji_Picker_Data_Test extends WP_UnitTestCase {

	/**
	 * @covers ::gutenberg_emoji_to_hexcode
	 */
	public function test_gutenberg_emoji_to_hexcode_basic_codepoint() {
		$this->assertSame( '1F600', gutenberg_emoji_to_hexcode( '😀' ) );
		$this->assertSame( '1F389', gutenberg_emoji_to_hexcode( '🎉' ) );
		$this->assertSame( '1F680', gutenberg_emoji_to_hexcode( '🚀' ) );
	}

	/**
	 * Variation Selector-16 (U+FE0F) is stripped so qualified
	 * presentations match Emojibase's unqualified `hexcode` keys.
	 *
	 * @covers ::gutenberg_emoji_to_hexcode
	 */
	public function test_gutenberg_emoji_to_hexcode_strips_vs16() {
		$this->assertSame( '2764', gutenberg_emoji_to_hexcode( "\u{2764}\u{FE0F}" ) );
		$this->assertSame( '2764', gutenberg_emoji_to_hexcode( '❤️' ) );
	}

	/**
	 * ZWJ sequences round-trip with a `-`-joined uppercase hex string,
	 * matching Emojibase's representation for combined emoji.
	 *
	 * @covers ::gutenberg_emoji_to_hexcode
	 */
	public function test_gutenberg_emoji_to_hexcode_zwj_sequence() {
		// 👨‍💻 = U+1F468 + U+200D + U+1F4BB
		$this->assertSame(
			'1F468-200D-1F4BB',
			gutenberg_emoji_to_hexcode( '👨‍💻' )
		);
	}

	/**
	 * @covers ::gutenberg_emoji_to_hexcode
	 */
	public function test_gutenberg_emoji_to_hexcode_handles_invalid_input() {
		$this->assertSame( '', gutenberg_emoji_to_hexcode( '' ) );
		$this->assertSame( '', gutenberg_emoji_to_hexcode( null ) );
		$this->assertSame( '', gutenberg_emoji_to_hexcode( 42 ) );
	}

	/**
	 * Malformed UTF-8 must return an empty string rather than emitting a
	 * garbage hex key. The decoder is byte-level and does not depend on
	 * the `mbstring` extension.
	 *
	 * @covers ::gutenberg_emoji_to_hexcode
	 */
	public function test_gutenberg_emoji_to_hexcode_rejects_invalid_utf8() {
		// Lone continuation byte.
		$this->assertSame( '', gutenberg_emoji_to_hexcode( "\x80" ) );
		// Lead byte with missing continuation bytes.
		$this->assertSame( '', gutenberg_emoji_to_hexcode( "\xF0\x9F" ) );
		// Truncated 4-byte sequence followed by ASCII.
		$this->assertSame( '', gutenberg_emoji_to_hexcode( "\xF0\x9F\x98a" ) );
		// Invalid lead byte (0xF8 starts a 5-byte form, never valid UTF-8).
		$this->assertSame( '', gutenberg_emoji_to_hexcode( "\xF8\x88\x80\x80\x80" ) );
	}

	/**
	 * Code points across the 1-4 byte UTF-8 ranges decode correctly.
	 *
	 * @covers ::gutenberg_emoji_to_hexcode
	 */
	public function test_gutenberg_emoji_to_hexcode_covers_all_byte_lengths() {
		// 1 byte: U+0023 (#), part of keycap sequences.
		$this->assertSame( '23', gutenberg_emoji_to_hexcode( '#' ) );
		// 2 bytes: U+00A9 (©).
		$this->assertSame( 'A9', gutenberg_emoji_to_hexcode( "\u{00A9}" ) );
		// 3 bytes: U+2764 (❤).
		$this->assertSame( '2764', gutenberg_emoji_to_hexcode( "\u{2764}" ) );
		// 4 bytes: U+1F600 (😀) — asserted in the basic test as well.
		$this->assertSame( '1F600', gutenberg_emoji_to_hexcode( "\u{1F600}" ) );
	}

	/**
	 * The default override map seeds the curated reaction emojis so the
	 * full picker shows the same translated label as the curated row.
	 *
	 * @covers ::gutenberg_emoji_picker_label_overrides_register_inline_script
	 */
	public function test_default_overrides_seeded_from_curated_reactions() {
		gutenberg_emoji_picker_label_overrides_register_inline_script();

		$inline = wp_scripts()->get_data( 'wp-editor', 'before' );
		$this->assertNotEmpty( $inline, 'Expected inline script to be registered.' );

		$payload = is_array( $inline ) ? implode( "\n", $inline ) : (string) $inline;
		$this->assertStringContainsString(
			'window.gutenbergEmojiLabelOverrides',
			$payload
		);

		// Heart, Celebration, Smile, Eyes, Rocket — the five curated
		// reactions defined in gutenberg_get_note_reaction_emojis().
		$this->assertStringContainsString( '"2764":', $payload );
		$this->assertStringContainsString( '"1F389":', $payload );
		$this->assertStringContainsString( '"1F604":', $payload );
		$this->assertStringContainsString( '"1F440":', $payload );
		$this->assertStringContainsString( '"1F680":', $payload );
	}

	/**
	 * @covers ::gutenberg_emoji_picker_label_overrides_register_inline_script
	 */
	public function test_filter_can_extend_overrides() {
		$callback = static function ( $overrides ) {
			$overrides['1F44D'] = 'Custom thumbs up';
			return $overrides;
		};
		add_filter( 'gutenberg_emoji_picker_label_overrides', $callback );

		gutenberg_emoji_picker_label_overrides_register_inline_script();

		$inline  = wp_scripts()->get_data( 'wp-editor', 'before' );
		$payload = is_array( $inline ) ? implode( "\n", $inline ) : (string) $inline;

		$this->assertStringContainsString( '"1F44D":"Custom thumbs up"', $payload );

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	/**
	 * @covers ::gutenberg_emoji_picker_label_overrides_register_inline_script
	 */
	public function test_filter_can_replace_overrides_entirely() {
		$callback = static function () {
			return array();
		};
		add_filter( 'gutenberg_emoji_picker_label_overrides', $callback );

		gutenberg_emoji_picker_label_overrides_register_inline_script();

		$inline  = wp_scripts()->get_data( 'wp-editor', 'before' );
		$payload = is_array( $inline ) ? implode( "\n", $inline ) : (string) $inline;

		// The map serializes to {} (a JS object literal), not [].
		$this->assertStringContainsString(
			'window.gutenbergEmojiLabelOverrides = {};',
			$payload
		);

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	/**
	 * @covers ::gutenberg_emoji_picker_label_overrides_register_inline_script
	 */
	public function test_filter_drops_non_string_values() {
		$callback = static function () {
			return array(
				'1F600' => 'Grin',                 // Kept.
				'1F44D' => array( 'array value' ), // Dropped.
				'1F389' => 42,                     // Dropped.
				'1F680' => 'Rocket',               // Kept.
			);
		};
		add_filter( 'gutenberg_emoji_picker_label_overrides', $callback );

		gutenberg_emoji_picker_label_overrides_register_inline_script();

		$inline  = wp_scripts()->get_data( 'wp-editor', 'before' );
		$payload = is_array( $inline ) ? implode( "\n", $inline ) : (string) $inline;

		$this->assertStringContainsString( '"1F600":"Grin"', $payload );
		$this->assertStringContainsString( '"1F680":"Rocket"', $payload );
		$this->assertStringNotContainsString( '"1F44D"', $payload );
		$this->assertStringNotContainsString( '"1F389":42', $payload );

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	/**
	 * @covers ::gutenberg_emoji_picker_label_overrides_register_inline_script
	 */
	public function test_filter_returning_non_array_is_treated_as_empty() {
		$callback = static function () {
			return 'not an array';
		};
		add_filter( 'gutenberg_emoji_picker_label_overrides', $callback );

		gutenberg_emoji_picker_label_overrides_register_inline_script();

		$inline  = wp_scripts()->get_data( 'wp-editor', 'before' );
		$payload = is_array( $inline ) ? implode( "\n", $inline ) : (string) $inline;

		$this->assertStringContainsString(
			'window.gutenbergEmojiLabelOverrides = {};',
			$payload
		);

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	public function tear_down() {
		// Reset inline script state between tests so the order in which
		// the suite runs doesn't pollute the assertions.
		wp_scripts()->add_data( 'wp-editor', 'before', array() );
		parent::tear_down();
	}
}
