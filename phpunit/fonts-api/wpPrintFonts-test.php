<?php
/**
 * Unit and integration tests for wp_print_fonts().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';
require_once __DIR__ . '/../fixtures/mock-provider.php';

/**
 * @group  fontsapi
 * @covers ::wp_print_fonts
 */
class Tests_Fonts_WpPrintFonts extends WP_Fonts_TestCase {

	public function test_should_return_empty_array_when_global_not_instance() {
		global $wp_fonts;
		wp_fonts();
		$wp_fonts = null;

		$this->assertSame( array(), wp_print_fonts() );
		$this->assertNotInstanceOf( WP_Webfonts::class, $wp_fonts );
	}

	/**
	 * Unit test to mock WP_Webfonts::do_items().
	 *
	 * @dataProvider data_mocked_handles
	 *
	 * @param string|string[]|false $handles  Handles to test.
	 * @param array|string[]        $expected Expected array of processed handles.
	 */
	public function test_should_return_mocked_handles( $handles, $expected ) {
		$mock = $this->set_up_mock( 'do_items' );
		$mock->expects( $this->once() )
			->method( 'do_items' )
			->with(
				$this->identicalTo( $handles )
			)
			->will( $this->returnValue( $expected ) );

		wp_print_fonts( $handles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_mocked_handles() {
		return array(
			'no handles'          => array(
				'handles'  => false,
				'expected' => array(),
			),
			'font family handles' => array(
				'handles'  => array( 'my-custom-font' ),
				'expected' => array( 'my-custom-font' ),
			),
		);
	}

	/**
	 * Integration test that registers providers and fonts and then enqueues before
	 * testing the printing functionality.
	 *
	 * @dataProvider data_print_enqueued
	 *
	 * @param array  $setup           Test set up information for provider, fonts, and enqueued.
	 * @param array  $expected_done   Expected array of printed handles.
	 * @param string $expected_output Expected printed output.
	 */
	public function test_should_print_enqueued( $setup, $expected_done, $expected_output ) {
		$wp_fonts = wp_fonts();

		$this->setup_integrated_deps( $setup, $wp_fonts );

		$this->expectOutputString( $expected_output );
		$actual_done = wp_print_fonts();
		$this->assertSameSets( $expected_done, $actual_done, 'Printed handles should match' );
	}

	/**
	 * Integration test to validate printing given handles. Rather than mocking internal functionality,
	 * it registers providers and fonts but does not enqueue.
	 *
	 * @dataProvider data_print_enqueued
	 *
	 * @param array  $setup           Test set up information for provider, fonts, and enqueued.
	 * @param array  $expected_done   Expected array of printed handles.
	 * @param string $expected_output Expected printed output.
	 */
	public function test_should_print_handles_when_not_enqueued( $setup, $expected_done, $expected_output ) {
		$wp_fonts = wp_fonts();

		$this->setup_integrated_deps( $setup, $wp_fonts, false );
		// Do not enqueue. Instead, pass the handles to wp_print_fonts().
		$handles = $setup['enqueued'];
		$this->assertEmpty( $wp_fonts->queue, 'No fonts should be enqueued' );

		$this->expectOutputString( $expected_output );
		$actual_done = wp_print_fonts( $handles );
		$this->assertSameSets( $expected_done, $actual_done, 'Printed handles should match' );
	}

	/**
	 * Sets up the dependencies for integration test.
	 *
	 * @param array    $setup    Dependencies to set up.
	 * @param WP_Fonts $wp_fonts Instance of WP_Fonts.
	 * @param bool     $enqueue  Whether to enqueue. Default true.
	 */
	private function setup_integrated_deps( array $setup, $wp_fonts, $enqueue = true ) {
		foreach ( $setup['provider'] as $provider ) {
			$wp_fonts->register_provider( $provider['id'], $provider['class'] );
		}
		foreach ( $setup['registered'] as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_fonts );
		}

		if ( $enqueue ) {
			$wp_fonts->enqueue( $setup['enqueued'] );
		}
	}
}
