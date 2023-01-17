<?php
/**
 * WP_Fonts::get_enqueued() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::get_enqueued
 */
class Tests_Fonts_WpFonts_GetEnqueued extends WP_Fonts_TestCase {

	public function test_should_return_empty_when_non_enqueued() {
		$wp_fonts = new WP_Fonts();
		$this->assertEmpty( $wp_fonts->get_enqueued() );
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
		$wp_fonts        = new WP_Fonts();
		$wp_fonts->queue = $expected;

		$this->assertSame( $expected, $wp_fonts->get_enqueued() );
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
		$wp_fonts = new WP_Fonts();

		// Register and enqueue.
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_fonts );
		}
		$wp_fonts->enqueue( $font_family );

		$this->assertSame( $expected, $wp_fonts->get_enqueued() );
	}
}
