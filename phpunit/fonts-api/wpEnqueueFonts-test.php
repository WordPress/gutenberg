<?php
/**
 * Unit and integration tests for wp_enqueue_fonts().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers ::wp_enqueue_fonts
 * @covers WP_Fonts::enqueue
 */
class Tests_Fonts_WpEnqueueFonts extends WP_Fonts_TestCase {

	/**
	 * Unit test for registering a font-family that mocks WP_Fonts.
	 *
	 * @dataProvider data_should_enqueue
	 *
	 * @param string[] $font_families    Font families to test.
	 * @param string[] $expected_handles Expected handles passed to WP_Fonts::enqueue().
	 */
	public function test_unit_should_enqueue( $font_families, $expected_handles ) {
		$mock = $this->set_up_mock( 'enqueue' );
		$mock->expects( $this->once() )
			->method( 'enqueue' )
			->with(
				$this->identicalTo( $expected_handles )
			);

		wp_enqueue_fonts( $font_families );
	}

	/**
	 * Integration test for enqueuing a font family and all of its variations.
	 *
	 * @dataProvider data_should_enqueue
	 *
	 * @param string[] $font_families    Font families to test.
	 * @param string[] $expected_handles Expected handles passed to WP_Fonts::enqueue().
	 */
	public function test_should_enqueue_after_registration( $font_families, $expected_handles ) {
		// Register the font-families.
		foreach ( $this->get_data_registry() as $handle => $variations ) {
			$this->setup_register( $handle, $variations );
		}

		wp_enqueue_fonts( $font_families );

		$this->assertEmpty( $this->get_queued_before_register(), '"queued_before_register" queue should be empty' );
		$this->assertSame( $expected_handles, $this->get_enqueued_handles(), 'Queue should contain the given font family(ies)' );
	}

	/**
	 * Integration test for enqueuing before registering a font family and all of its variations.
	 *
	 * @dataProvider data_should_enqueue
	 *
	 * @param string[] $font_families    Font families to test.
	 * @param string[] $expected_handles Expected handles passed to WP_Fonts::enqueue().
	 */
	public function test_should_enqueue_before_registration( $font_families, $expected_handles ) {
		wp_enqueue_fonts( $font_families );

		// Set up what "queued_before_register" queue should be.
		$expected = array();
		foreach ( $expected_handles as $handle ) {
			$expected[ $handle ] = null;
		}
		$this->assertSame( $expected, $this->get_queued_before_register(), '"queued_before_register" queue should contain the given font family(ies)' );
		$this->assertEmpty( $this->get_enqueued_handles(), 'Queue should be empty' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_enqueue() {
		return array(
			'1: single word handle'                 => array(
				'font_families'    => array( 'lato' ),
				'expected_handles' => array( 'lato' ),
			),
			'1: multiple word handle'               => array(
				'font_families'    => array( 'source-serif-pro' ),
				'expected_handles' => array( 'source-serif-pro' ),
			),
			'1: single word name'                   => array(
				'font_families'    => array( 'Merriweather' ),
				'expected_handles' => array( 'merriweather' ),
			),
			'1: multiple word name'                 => array(
				'font_families'    => array( 'My Font' ),
				'expected_handles' => array( 'my-font' ),
			),
			'>1: single word handle'                => array(
				'font_families'    => array( 'lato', 'merriweather' ),
				'expected_handles' => array( 'lato', 'merriweather' ),
			),
			'>1: multiple word handle'              => array(
				'font_families'    => array( 'source-serif-pro', 'my-font' ),
				'expected_handles' => array( 'source-serif-pro', 'my-font' ),
			),
			'>1: single word name'                  => array(
				'font_families'    => array( 'Lato', 'Merriweather' ),
				'expected_handles' => array( 'lato', 'merriweather' ),
			),
			'>1: multiple word name'                => array(
				'font_families'    => array( 'My Font', 'Source Serif Pro' ),
				'expected_handles' => array( 'my-font', 'source-serif-pro' ),
			),
			'>1: mixture of word handles and names' => array(
				'font_families'    => array( 'Source Serif Pro', 'Merriweather', 'my-font', 'Lato' ),
				'expected_handles' => array( 'source-serif-pro', 'merriweather', 'my-font', 'lato' ),
			),
		);
	}
}
