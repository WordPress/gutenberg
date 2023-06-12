<?php
/**
 * Unit and integration tests for wp_enqueue_font_variations().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers ::wp_enqueue_font_variations
 * @covers WP_Webfonts::enqueue
 */
class Tests_Fonts_WpEnqueueFontVariations extends WP_Fonts_TestCase {

	/**
	 * Unit test for registering one or more specific variations that mocks WP_Webfonts.
	 *
	 * @dataProvider data_variation_handles
	 *
	 * @param string|string[] $handles Variation handles to test.
	 */
	public function test_unit_should_enqueue( $handles ) {
		$mock = $this->set_up_mock( 'enqueue' );
		$mock->expects( $this->once() )
			->method( 'enqueue' )
			->with(
				$this->identicalTo( $handles )
			);

		wp_enqueue_font_variations( $handles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_variation_handles() {
		return array(
			'1 variation handle'                   => array( 'merriweather-200-900-normal' ),
			'multiple same font family handles'    => array( array( 'Source Serif Pro-300-normal', 'Source Serif Pro-900-italic' ) ),
			'handles from different font families' => array( array( 'merriweather-200-900-normal', 'Source Serif Pro-900-italic' ) ),
		);
	}

	/**
	 * Integration test for enqueuing one or more specific variations.
	 *
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles  Variation handles to test.
	 * @param array           $expected Expected queue.
	 */
	public function test_should_enqueue_after_registration( $handles, array $expected ) {
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations );
		}

		wp_enqueue_font_variations( $handles );
		$this->assertEmpty( $this->get_queued_before_register(), '"queued_before_register" queue should be empty' );
		$this->assertSame( $expected, $this->get_enqueued_handles(), 'Queue should contain the given handles' );
	}

	/**
	 * Integration test for enqueuing before registering one or more specific variations.
	 *
	 * @dataProvider data_enqueue_variations
	 *
	 * @param string|string[] $handles  Variation handles to test.
	 * @param array           $not_used Not used.
	 * @param array           $expected Expected "queued_before_register" queue.
	 */
	public function test_should_enqueue_before_registration( $handles, array $not_used, array $expected ) {
		wp_enqueue_font_variations( $handles );

		$this->assertSame( $expected, $this->get_queued_before_register(), '"queued_before_register" queue should contain the given handles' );
		$this->assertEmpty( $this->get_enqueued_handles(), 'Queue should be empty' );
	}
}
