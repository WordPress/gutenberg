<?php
/**
 * Integration tests for wp_register_webfonts().
 *
 * @package WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_register_webfonts
 * @covers WP_Webfonts::add
 * @covers WP_Webfonts::add_variation
 */
class Tests_Webfonts_WpRegisterWebfonts extends WP_Webfonts_TestCase {
	use WP_Webfonts_Tests_Datasets;

	/**
	 * @dataProvider data_webfonts
	 *
	 * @param array $webfonts Array of webfonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register( array $webfonts, array $expected ) {
		$this->assertSame( $expected['wp_register_webfonts'], wp_register_webfonts( $webfonts ), 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Web fonts should match registered queue' );
	}

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @expectedIncorrectUsage wp_register_webfonts
	 *
	 * @param array $webfonts Array of webfonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register_with_deprecated_structure( array $webfonts, array $expected ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected['message'] );

		$this->assertSame( $expected['wp_register_webfonts'], wp_register_webfonts( $webfonts ), 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Web fonts should match registered queue' );
	}

	/**
	 * @dataProvider data_webfonts
	 *
	 * @param array $webfonts Array of webfonts to test.
	 */
	public function test_should_do_not_enqueue_on_registration( array $webfonts ) {
		wp_register_webfonts( $webfonts );
		$this->assertEmpty( $this->get_enqueued_handles() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_webfonts() {
		return array(
			'font family keyed with slug' => array(
				'webfonts' => array(
					'source-serif-pro' => array(
						array(
							'provider'     => 'local',
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
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						array(
							'provider'     => 'local',
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

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_deprecated_structure() {
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
					'message'              => 'Font family not found.',
				),
			),
		);
	}
}
