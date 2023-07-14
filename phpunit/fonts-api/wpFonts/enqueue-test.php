<?php
/**
 * WP_Fonts::enqueue() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::enqueue
 */
class Tests_Fonts_WpFonts_Enqueue extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles  Handles to test.
	 * @param array           $not_used Not used.
	 * @param array           $expected Expected "queued_before_register" queue.
	 */
	public function test_should_prequeue_when_not_registered( $handles, $not_used, $expected ) {
		$wp_fonts = new WP_Fonts();
		$wp_fonts->enqueue( $handles );

		$this->assertSame( $expected, $this->get_queued_before_register( $wp_fonts ), 'Handles should be added to before registered queue' );
		$this->assertEmpty( $wp_fonts->queue, 'Handles should not be added to the enqueue queue when not registered' );
	}

	/**
	 * Integration test for enqueuing (a) a font family and all of its variations or (b) specific variations.
	 *
	 * @dataProvider data_enqueue
	 * @dataProviders data_enqueue_variations
	 *
	 * @param string|string[] $handles  Handles to test.
	 * @param array           $expected Expected queue.
	 */
	public function test_should_enqueue_when_registered( $handles, array $expected ) {
		$wp_fonts = new WP_Fonts();
		foreach ( $this->get_data_registry() as $font_family => $variations ) {
			$this->setup_register( $font_family, $variations, $wp_fonts );
		}

		$wp_fonts->enqueue( $handles );

		$this->assertEmpty( $this->get_queued_before_register( $wp_fonts ), '"queued_before_register" queue should be empty' );
		$this->assertSame( $expected, $wp_fonts->queue, 'Queue should contain the given handles' );
	}
}
