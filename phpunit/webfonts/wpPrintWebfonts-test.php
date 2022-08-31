<?php
/**
 * Unit and integration tests for wp_print_webfonts().
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';
require_once __DIR__ . '/../fixtures/mock-provider.php';

/**
 * @group  webfonts
 * @covers ::wp_print_webfonts
 */
class Tests_Webfonts_WpPrintWebfonts extends WP_Webfonts_TestCase {

	public function test_should_return_empty_array_when_global_not_instance() {
		global $wp_webfonts;
		wp_webfonts();
		$wp_webfonts = null;

		$this->assertSame( array(), wp_print_webfonts() );
		$this->assertNotInstanceOf( WP_Webfonts::class, $wp_webfonts );
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

		wp_print_webfonts( $handles );
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
		$wp_webfonts = wp_webfonts();

		$this->setup_integrated_deps( $setup, $wp_webfonts );

		$this->expectOutputString( $expected_output );
		$actual_done = $wp_webfonts->do_items();
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
		$wp_webfonts = wp_webfonts();

		$this->setup_integrated_deps( $setup, $wp_webfonts, false );
		// Do not enqueue. Instead, pass the handles to wp_print_webfonts().
		$handles = $setup['enqueued'];
		$this->assertEmpty( $wp_webfonts->queue, 'No fonts should be enqueued' );

		$this->expectOutputString( $expected_output );
		$actual_done = wp_print_webfonts( $handles );
		$this->assertSameSets( $expected_done, $actual_done, 'Printed handles should match' );
	}

	/**
	 * Sets up the dependencies for integration test.
	 *
	 * @param array       $setup       Dependencies to set up.
	 * @param WP_Webfonts $wp_webfonts Instance of WP_Webfonts.
	 * @param bool        $enqueue     Whether to enqueue. Default true.
	 */
	private function setup_integrated_deps( array $setup, $wp_webfonts, $enqueue = true ) {
		foreach ( $setup['provider'] as $provider ) {
			$wp_webfonts->register_provider( $provider['id'], $provider['class'] );
		}
		foreach ( $setup['registered'] as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_webfonts );
		}

		if ( $enqueue ) {
			$wp_webfonts->enqueue( $setup['enqueued'] );
		}
	}
}
