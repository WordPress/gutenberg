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
	 * @dataProvider data_gutenberg_emoji_to_hexcode
	 *
	 * @covers ::gutenberg_emoji_to_hexcode
	 *
	 * @param mixed  $input    Value to convert.
	 * @param string $expected Expected Emojibase `hexcode` key.
	 */
	public function test_gutenberg_emoji_to_hexcode( $input, $expected ) {
		$this->assertSame( $expected, gutenberg_emoji_to_hexcode( $input ) );
	}

	public function data_gutenberg_emoji_to_hexcode() {
		return array(
			// One code point per UTF-8 byte length, zero-padded to four digits.
			'1 byte'                 => array( '#', '0023' ),
			'2 bytes'                => array( "\u{00A9}", '00A9' ),
			'3 bytes'                => array( "\u{2764}", '2764' ),
			'4 bytes'                => array( "\u{1F600}", '1F600' ),
			// VS16 is stripped to match Emojibase's unqualified keys.
			'VS16 stripped'          => array( "\u{2764}\u{FE0F}", '2764' ),
			'ZWJ sequence'           => array( "\u{1F468}\u{200D}\u{1F4BB}", '1F468-200D-1F4BB' ),
			'keycap sequence'        => array( "\u{0030}\u{FE0F}\u{20E3}", '0030-20E3' ),
			'empty string'           => array( '', '' ),
			'non-string'             => array( 42, '' ),
			// Malformed UTF-8 never yields a garbage key.
			'lone continuation byte' => array( "\x80", '' ),
			'truncated sequence'     => array( "\xF0\x9F\x98a", '' ),
			'invalid lead byte'      => array( "\xF8\x88\x80\x80\x80", '' ),
		);
	}

	/**
	 * The default override map seeds the named reaction emojis so the
	 * picker shows their translated labels on the Emojibase entries.
	 *
	 * @covers ::gutenberg_get_emoji_picker_label_overrides
	 */
	public function test_default_overrides_seeded_from_curated_reactions() {
		$overrides = gutenberg_get_emoji_picker_label_overrides();

		// Heart, Celebration, Smile, Eyes, Rocket - the five curated
		// reactions defined in gutenberg_get_note_reaction_emojis().
		$this->assertArrayHasKey( '2764', $overrides );
		$this->assertArrayHasKey( '1F389', $overrides );
		$this->assertArrayHasKey( '1F604', $overrides );
		$this->assertArrayHasKey( '1F440', $overrides );
		$this->assertArrayHasKey( '1F680', $overrides );
	}

	/**
	 * @covers ::gutenberg_get_emoji_picker_label_overrides
	 */
	public function test_filter_can_extend_overrides() {
		$callback = static function ( $overrides ) {
			$overrides['1F44D'] = 'Custom thumbs up';
			return $overrides;
		};
		add_filter( 'gutenberg_emoji_picker_label_overrides', $callback );

		$overrides = gutenberg_get_emoji_picker_label_overrides();

		$this->assertSame( 'Custom thumbs up', $overrides['1F44D'] );

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	/**
	 * @covers ::gutenberg_get_emoji_picker_label_overrides
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

		$this->assertSame(
			array(
				'1F600' => 'Grin',
				'1F680' => 'Rocket',
			),
			gutenberg_get_emoji_picker_label_overrides()
		);

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	/**
	 * @covers ::gutenberg_get_emoji_picker_label_overrides
	 */
	public function test_filter_returning_non_array_is_treated_as_empty() {
		$callback = static function () {
			return 'not an array';
		};
		add_filter( 'gutenberg_emoji_picker_label_overrides', $callback );

		$this->assertSame(
			array(),
			gutenberg_get_emoji_picker_label_overrides()
		);

		remove_filter( 'gutenberg_emoji_picker_label_overrides', $callback );
	}

	/**
	 * The picker configuration rides on the block editor settings - no
	 * page globals - so the editor package reads it through its normal
	 * settings boundary.
	 *
	 * @covers ::gutenberg_add_emojibase_settings
	 */
	public function test_emojibase_settings_injected() {
		$settings = gutenberg_add_emojibase_settings( array( 'existing' => true ) );

		$this->assertTrue( $settings['existing'] );
		if ( is_dir( gutenberg_dir_path() . 'build/emojibase-data' ) ) {
			$this->assertStringEndsWith(
				'build/emojibase-data',
				$settings['noteEmojibaseUrl']
			);
		} else {
			// No copied data, so the picker must not be pointed at a 404.
			$this->assertArrayNotHasKey( 'noteEmojibaseUrl', $settings );
		}
		$this->assertIsArray( $settings['noteEmojiLabelOverrides'] );
		$this->assertArrayHasKey( '2764', $settings['noteEmojiLabelOverrides'] );
	}
}
