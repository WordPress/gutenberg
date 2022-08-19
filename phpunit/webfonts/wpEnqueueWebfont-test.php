<?php
/**
 * Unit and integration tests for wp_enqueue_webfont().
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_enqueue_webfont
 * @covers WP_Webfonts::enqueue
 */
class Tests_Webfonts_WpEnqueueWebfont extends WP_Webfonts_TestCase {

	/**
	 * Unit test for registering a font-family that mocks WP_Webfonts.
	 *
	 * @dataProvider data_font_family_handles
	 *
	 * @param string $font_family Font family to test.
	 */
	public function test_unit_should_enqueue( $font_family ) {
		$mock = $this->set_up_mock( 'enqueue' );
		$mock->expects( $this->once() )
			->method( 'enqueue' )
			->with(
				$this->identicalTo( $font_family )
			);

		wp_enqueue_webfont( $font_family );
	}

	/**
	 * Integration test for enqueuing a font family and all of its variations.
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string|string[] $font_family Font family to test.
	 * @param array           $expected    Expected queue.
	 */
	public function test_should_enqueue_after_registration( $font_family, array $expected ) {
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations );
		}

		wp_enqueue_webfont( $font_family );
		$this->assertEmpty( $this->get_queued_before_register(), '"queued_before_register" queue should be empty' );
		$this->assertSame( $expected, $this->get_enqueued_handles(), 'Queue should contain the given font family(ies)' );
	}

	/**
	 * Integration test for enqueuing before registering a font family and all of its variations.
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string|string[] $font_family Font family to test.
	 * @param array           $not_used    Not used.
	 * @param array           $expected    Expected "queued_before_register" queue.
	 */
	public function test_should_enqueue_before_registration( $font_family, array $not_used, array $expected ) {
		wp_enqueue_webfont( $font_family );

		$this->assertSame( $expected, $this->get_queued_before_register(), '"queued_before_register" queue should contain the given font family(ies)' );
		$this->assertEmpty( $this->get_enqueued_handles(), 'Queue should be empty' );
	}
}
