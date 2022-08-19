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
	 *
	 * @param string|string[] $font_family Font family to test.
	 * @param array           $not_used    Not used.
	 * @param array           $expected    Expected "queued_before_register" queue.
	 */
	public function test_should_prequeue_when_not_registered( $font_family, $not_used, $expected ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->enqueue( $font_family );

		$this->assertSame( $expected, $this->get_queued_before_register( $wp_webfonts ), 'Font family(ies) should be added to before registered queue' );
		$this->assertEmpty( $this->queue, 'Font family(ies) should not be added to the enqueue queue when not registered' );
	}

	/**
	 * Integration test for enqueuing a font family and all of its variations.
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string|string[] $font_family Font family to test.
	 * @param array           $expected    Expected queue.
	 */
	public function test_should_enqueue_when_registered( $font_family, array $expected ) {
		$wp_webfonts = new WP_Webfonts();
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_webfonts );
		}

		$wp_webfonts->enqueue( $font_family );

		$this->assertEmpty( $this->get_queued_before_register( $wp_webfonts ), '"queued_before_register" queue should be empty' );
		$this->assertSame( $expected, $wp_webfonts->queue, 'Queue should contain the given font family(ies)' );
	}
}
