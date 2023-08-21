<?php
/**
 * Unit and integration tests for wp_fonts().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers ::wp_fonts
 */
class Tests_Fonts_WpFonts extends WP_Fonts_TestCase {

	public function test_returns_instance() {
		$this->assertInstanceOf( WP_Fonts::class, wp_fonts() );
	}

	public function test_global_set() {
		global $wp_fonts;
		$this->assertNull( $wp_fonts );
		$instance = wp_fonts();
		$this->assertInstanceOf( WP_Fonts::class, $wp_fonts );
		$this->assertSame( $instance, $wp_fonts );
	}

	public function test_local_provider_is_automatically_registered() {
		$expected = array(
			'local' => array(
				'class' => 'WP_Fonts_Provider_Local',
				'fonts' => array(),
			),
		);
		$this->assertSame( $expected, wp_fonts()->get_providers() );
	}
}
