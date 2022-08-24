<?php
/**
 * WP_Webfonts::enqueue() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::enqueue
 */
class Tests_Webfonts_WpWebfonts_Enqueue extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles  Handles to test.
	 * @param array           $not_used Not used.
	 * @param array           $expected Expected "queued_before_register" queue.
	 */
	public function test_should_prequeue_when_not_registered( $handles, $not_used, $expected ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->enqueue( $handles );

		$this->assertSame( $expected, $this->get_queued_before_register( $wp_webfonts ), 'Handles should be added to before registered queue' );
		$this->assertEmpty( $this->queue, 'Handles should not be added to the enqueue queue when not registered' );
	}

	/**
	 * Integration test for enqueuing (a) a font family and all of its variations or (b) specific variations.
	 *
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles  Handles to test.
	 * @param array           $expected Expected queue.
	 */
	public function test_should_enqueue_when_registered( $handles, array $expected ) {
		$wp_webfonts = new WP_Webfonts();
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_webfonts );
		}

		$wp_webfonts->enqueue( $handles );

		$this->assertEmpty( $this->get_queued_before_register( $wp_webfonts ), '"queued_before_register" queue should be empty' );
		$this->assertSame( $expected, $wp_webfonts->queue, 'Queue should contain the given handles' );
	}
}
