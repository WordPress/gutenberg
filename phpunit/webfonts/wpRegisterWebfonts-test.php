<?php
/**
 * Register webfonts tests.
 *
 * @package WordPress
 * @subpackage Webfonts
 */

/**
 * @group  webfonts
 * @covers ::wp_register_webfonts
 */
class Tests_Webfonts_WpRegisterWebfonts extends WP_UnitTestCase {
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
	 * Test wp_register_webfonts() bulk register webfonts.
	 *
	 * @dataProvider data_wp_register_webfonts
	 *
	 * @covers wp_register_webfonts
	 * @covers WP_Webfonts::add
	 * @covers WP_Webfonts::add_variation
	 *
	 * @param array $webfonts Array of webfonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_wp_register_webfonts( array $webfonts, array $expected ) {
		$this->assertSame( $expected['wp_register_webfonts'], wp_register_webfonts( $webfonts ), 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], wp_webfonts()->get_registered(), 'Web fonts should match registered queue' );
		$this->assertSame( array(), wp_webfonts()->get_enqueued(), 'No web fonts should be enqueued' );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_wp_register_webfonts() {
		return array(
			'font family not keyed' => array(
				'webfonts' => array(
					array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array(),
					'get_registered'       => array(),
				),
			),
			'font family keyed with slug' => array(
				'webfonts' => array(
					'source-serif-pro' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array( 'source-serif-pro' ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-200-900-normal',
					),
				),
			),
			'font family keyed with name' => array(
				'webfonts' => array(
					'Source Serif Pro' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array( 'source-serif-pro' ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-200-900-normal',
						'source-serif-pro-200-900-italic',
					),
				),
			),
		);
	}
}
