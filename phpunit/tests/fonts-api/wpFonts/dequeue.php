<?php
/**
 * WP_Fonts::dequeue() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::dequeue
 */
class Tests_Fonts_WpFonts_Dequeue extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles Handles to test.
	 */
	public function test_should_do_nothing_when_handles_not_queued( $handles ) {
		$wp_fonts = new WP_Fonts();

		$wp_fonts->dequeue( $handles );
		$this->assertEmpty( $this->get_queued_before_register( $wp_fonts ), 'Prequeue should be empty' );
		$this->assertEmpty( $wp_fonts->queue, 'Queue should be empty' );
	}

	/**
	 * Integration test for dequeuing from queue. It first registers and then enqueues before dequeuing.
	 *
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles Handles to test.
	 */
	public function test_should_dequeue_from_queue( $handles ) {
		$wp_fonts = new WP_Fonts();

		// Register and enqueue.
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_fonts );
		}
		$wp_fonts->enqueue( $handles );

		// To make sure the handles are in the queue before dequeuing.
		$this->assertNotEmpty( $wp_fonts->queue, 'Queue not be empty before dequeueing' );

		// Run the test.
		$wp_fonts->dequeue( $handles );
		$this->assertEmpty( $wp_fonts->queue, 'Queue should be empty after dequeueing' );
	}

	/**
	 * Integration test for dequeuing from prequeue. It enqueues first.
	 *
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles Handles to test.
	 */
	public function test_should_dequeue_from_prequeue( $handles ) {
		$wp_fonts = new WP_Fonts();
		$wp_fonts->enqueue( $handles );
		$this->assertNotEmpty( $this->get_queued_before_register( $wp_fonts ), 'Prequeue not be empty before dequeueing' );

		$wp_fonts->dequeue( $handles );
		$this->assertEmpty( $this->get_queued_before_register( $wp_fonts ), 'Prequeue should be empty after dequeueing' );
	}
}
