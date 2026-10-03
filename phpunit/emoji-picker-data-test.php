<?php
/**
 * Tests for the editor emoji picker's PHP-side settings.
 *
 * @package gutenberg
 */

/**
 * @group emoji-picker
 */
class Emoji_Picker_Data_Test extends WP_UnitTestCase {

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
	}
}
