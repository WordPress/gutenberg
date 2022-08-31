<?php
/**
 * WP_Webfonts::dequeue() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::dequeue
 */
class Tests_Webfonts_WpWebfonts_Dequeue extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_enqueue
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles Handles to test.
	 */
	public function test_should_do_nothing_when_handles_not_queued( $handles ) {
		$wp_webfonts = new WP_Webfonts();

		$wp_webfonts->dequeue( $handles );
		$this->assertEmpty( $this->get_queued_before_register( $wp_webfonts ), 'Prequeue should be empty' );
		$this->assertEmpty( $wp_webfonts->queue, 'Queue should be empty' );
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
		$wp_webfonts = new WP_Webfonts();

		// Register and enqueue.
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_webfonts );
		}
		$wp_webfonts->enqueue( $handles );

		// To make sure the handles are in the queue before dequeuing.
		$this->assertNotEmpty( $wp_webfonts->queue, 'Queue not be empty before dequeueing' );

		// Run the test.
		$wp_webfonts->dequeue( $handles );
		$this->assertEmpty( $wp_webfonts->queue, 'Queue should be empty after dequeueing' );
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
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->enqueue( $handles );
		$this->assertNotEmpty( $this->get_queued_before_register( $wp_webfonts ), 'Prequeue not be empty before dequeueing' );

		$wp_webfonts->dequeue( $handles );
		$this->assertEmpty( $this->get_queued_before_register( $wp_webfonts ), 'Prequeue should be empty after dequeueing' );
	}
}
