<?php
/**
 * Unit and integration tests for wp_webfonts().
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_webfonts
 */
class Tests_Webfonts_WpWebfonts extends WP_Webfonts_TestCase {

	public function test_returns_instance() {
		$this->assertInstanceOf( WP_Webfonts::class, wp_webfonts() );
	}

	public function test_global_set() {
		global $wp_webfonts;
		$this->assertNull( $wp_webfonts );
		$instance = wp_webfonts();
		$this->assertInstanceOf( WP_Webfonts::class, $wp_webfonts );
		$this->assertSame( $instance, $wp_webfonts );
	}

	public function test_local_provider_is_automatically_registered() {
		$expected = array(
			'local' => array(
				'class' => 'WP_Webfonts_Provider_Local',
				'fonts' => array(),
			),
		);
		$this->assertSame( $expected, wp_webfonts()->get_providers() );
	}
}
