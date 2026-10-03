<?php
/**
 * Tests for the editor emoji picker's PHP-side settings and filter.
 *
 * @package gutenberg
 */

/**
 * @group emoji-picker
 */
class Emoji_Picker_Data_Test extends WP_UnitTestCase {

	/**
	 * The default override map seeds the named reaction emojis so the
	 * picker shows their translated labels on the Emojibase entries.
	 *
	 * @covers ::gutenberg_get_emoji_picker_label_overrides
	 */
	public function test_default_overrides_seeded_from_named_reactions() {
		$overrides = gutenberg_get_emoji_picker_label_overrides();

		// Heart, Celebration, Smile, Eyes, Rocket.
		$this->assertSame( 'Heart', $overrides['2764'] );
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
