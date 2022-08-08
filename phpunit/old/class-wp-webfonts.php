<?php
/**
 * This test class will not run.
 *
 * @TODO Remove this file once tests are ported to new test classes.
 */

/**
 * @group  webfonts
 * @covers WP_Webfonts
 */
class Webfonts_WpWebfonts extends WP_UnitTestCase {
	/**
	 * WP_Webfonts instance reference
	 *
	 * @var WP_Webfonts
	 */
	private $old_wp_webfonts;

	public function set_up() {
		parent::set_up();

		global $wp_webfonts;
		$this->old_wp_webfonts = $wp_webfonts;

		$wp_webfonts = null;
	}

	public function tear_down() {
		global $wp_webfonts;

		$wp_webfonts = $this->old_wp_webfonts;
		parent::tear_down();
	}

	/**
	 * Test wp_enqueue_webfonts() bulk enqueue webfonts.
	 *
	 * @covers wp_enqueue_webfonts
	 * @covers WP_Webfonts::enqueue_font
	 * @covers WP_Webfonts::get_enqueued_fonts
	 * @covers WP_Webfonts::get_registered_fonts
	 */
	public function test_wp_enqueue_webfonts() {
		$source_serif_pro = array(
			'provider'     => 'local',
			'font-family'  => 'Source Serif Pro',
			'font-style'   => 'normal',
			'font-weight'  => '200 900',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			'font-display' => 'fallback',
		);

		wp_register_webfont( $source_serif_pro );

		$roboto = array(
			'provider'     => 'local',
			'font-family'  => 'Roboto',
			'font-style'   => 'normal',
			'font-weight'  => '400',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/roboto/Roboto.ttf.woff2',
			'font-display' => 'fallback',
		);

		wp_register_webfont( $roboto );

		$expected = array(
			wp_webfonts()->get_font_slug( $source_serif_pro['font-family'] ) => array( $source_serif_pro ),
			wp_webfonts()->get_font_slug( $roboto['font-family'] ) => array( $roboto ),
		);

		wp_enqueue_webfonts(
			array(
				$source_serif_pro['font-family'],
				$roboto['font-family'],
			)
		);

		$this->assertEquals( $expected, wp_webfonts()->get_enqueued_webfonts() );
		$this->assertEquals( array(), wp_webfonts()->get_registered_webfonts() );
	}

	/**
	 * Test wp_enqueue_font() enqueues a registered webfont.
	 *
	 * @covers wp_enqueue_webfont
	 * @covers WP_Webfonts::enqueued_font
	 * @covers WP_Webfonts::get_enqueued_fonts
	 * @covers WP_Webfonts::get_registered_fonts
	 */
	public function test_wp_enqueue_webfont_enqueues_registered_webfont() {
		$font_family_name = 'Source Serif Pro';

		$font = array(
			'provider'     => 'local',
			'font-family'  => $font_family_name,
			'font-style'   => 'normal',
			'font-weight'  => '200 900',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			'font-display' => 'fallback',
		);

		$expected = array(
			wp_webfonts()->get_font_slug( $font_family_name ) => array( $font ),
		);

		wp_register_webfont( $font );
		wp_enqueue_webfont( $font_family_name );

		$this->assertEquals( array(), wp_webfonts()->get_registered_webfonts() );
		$this->assertEquals( $expected, wp_webfonts()->get_enqueued_webfonts() );
	}

	/**
	 * Test wp_enqueue_font() does not enqueue a webfont that was not registered.
	 *
	 * @covers wp_enqueue_webfont
	 * @covers WP_Webfonts::enqueued_font
	 * @covers WP_Webfonts::get_enqueued_fonts
	 * @covers WP_Webfonts::get_registered_fonts
	 *
	 * @expectedIncorrectUsage WP_Webfonts::enqueue_webfont
	 */
	public function test_wp_enqueue_webfont_does_not_enqueue_unregistered_webfont() {
		$font_family_name = 'Source Serif Pro';

		wp_enqueue_webfont( $font_family_name );

		$this->assertSame( array(), wp_webfonts()->get_registered_webfonts(), 'WP_Webfonts::get_registered_webfonts should return an empty array' );
		$this->assertSame( array(), wp_webfonts()->get_enqueued_webfonts(), 'WP_Webfonts::get_enqueued_webfonts should return an empty array' );
	}

	/**
	 * @covers wp_register_webfont
	 * @covers WP_Webfonts::register_provider
	 * @covers WP_Webfonts::get_providers
	 */
	public function test_get_providers() {
		wp_register_webfont_provider( 'test-provider', 'Test_Provider' );
		$this->assertEquals(
			array(
				'local'         => 'WP_Webfonts_Provider_Local',
				'test-provider' => 'Test_Provider',
			),
			wp_get_webfont_providers()
		);
	}
}
