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

	public function test_should_return_empty_when_non_enqueued() {
		$wp_webfonts = new WP_Webfonts();
		$this->assertEmpty( $wp_webfonts->get_enqueued() );
	}

	/**
	 * Unit test for when font families are enqueued.
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string|string[] $not_used Not used.
	 * @param array           $expected    Expected queue.
	 */
	public function test_should_return_queue_when_property_has_font_families( $not_used, array $expected ) {
		$wp_webfonts        = new WP_Webfonts();
		$wp_webfonts->queue = $expected;

		$this->assertSame( $expected, $wp_webfonts->get_enqueued() );
	}

	/**
	 * Full integration test that registers and enqueues the queue
	 * is properly wired for "get_enqueued()".
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string|string[] $font_family Font family to test.
	 * @param array           $expected    Expected queue.
	 */
	public function test_should_return_queue_when_font_families_registered_and_enqueued( $font_family, array $expected ) {
		$wp_webfonts = new WP_Webfonts();

		// Register and enqueue.
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_webfonts );
		}
		$wp_webfonts->enqueue( $font_family );

		$this->assertSame( $expected, $wp_webfonts->get_enqueued() );
	}
}
