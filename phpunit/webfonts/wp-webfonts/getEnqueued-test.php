<?php
/**
 * WP_Webfonts::get_enqueued() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::get_enqueued
 */
class Tests_Webfonts_WpWebfonts_GetEnqueued extends WP_Webfonts_TestCase {

	public function test_enqueued_is_empty() {
		$wp_webfonts = new WP_Webfonts();
		$this->assertEmpty( $wp_webfonts->get_enqueued() );
	}

	public function test_get_enqueued() {
		// TODO: Add tests for WP_Webfonts::get_enqueued().
	}
}
