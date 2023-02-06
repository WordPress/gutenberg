<?php
/**
 * WP_Fonts::do_items() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';
require_once __DIR__ . '/../../fixtures/mock-provider.php';

/**
 * @group  fontsapi
 * @group  printfonts
 * @covers WP_Fonts::do_items
 */
class Tests_Fonts_WpFonts_DoItems extends WP_Fonts_TestCase {
	private $wp_fonts;

	public function set_up() {
		parent::set_up();
		$this->wp_fonts = new WP_Fonts;
	}

	public function test_should_not_process_when_no_providers_registered() {
		$this->setup_deps( array( 'enqueued' => 'font1' ) );

		$done = $this->wp_fonts->do_items();

		$this->assertSame( array(), $done, 'WP_Fonts::do_items() should return an empty array' );
		$this->assertSame( array(), $this->wp_fonts->to_do, 'WP_Fonts::$to_do should be an empty array' );
	}

	/**
	 * @dataProvider data_invalid_handles
	 *
	 * @param mixed $handles Handles to test.
	 */
	public function test_should_throw_notice_when_invalid_handles( $handles ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Handles must be a non-empty string or array of non-empty strings' );

		$this->wp_fonts->do_items( $handles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_handles() {
		return array(
			'null'                         => array( null ),
			'empty array'                  => array( array() ),
			'empty string'                 => array( '' ),
			'array of empty strings'       => array( array( '', '' ) ),
			'array of mixed falsey values' => array( array( '', false, null, array() ) ),
		);
	}

	public function test_should_throw_notice_when_provider_class_not_found() {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Class "Provider_Does_Not_Exist" not found for "doesnotexist" font provider' );

		$setup = array(
			'provider'         => array(
				'doesnotexist' => array(
					'id'    => 'doesnotexist',
					'class' => 'Provider_Does_Not_Exist',
				),
			),
			'provider_handles' => array( 'doesnotexist' => array( 'font1' ) ),
			'registered'       => array(
				'doesnotexist' => array(
					'font1' => array(
						'font1-300-normal' => array(
							'provider'     => 'doesnotexist',
							'font-weight'  => '300',
							'font-style'   => 'normal',
							'font-display' => 'fallback',
						),
					),
				),
			),
			'enqueued'         => array( 'font1', 'font1-300-normal' ),
		);
		$this->setup_deps( $setup );

		$this->wp_fonts->do_items();
	}

	/**
	 * @dataProvider data_print_enqueued
	 *
	 * @param array  $setup           Test set up information for provider, fonts, and enqueued.
	 * @param array  $expected_done   Expected array of printed handles.
	 * @param string $expected_output Expected printed output.
	 */
	public function test_should_print_mocked_enqueued( $setup, $expected_done, $expected_output ) {
		$this->setup_deps( $setup );

		$this->expectOutputString( $expected_output );
		$actual_done = $this->wp_fonts->do_items();
		$this->assertSameSets( $expected_done, $actual_done, 'Printed handles should match' );
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
		$this->setup_integrated_deps( $setup );

		$this->expectOutputString( $expected_output, 'Printed @font-face styles should match' );
		$actual_done = $this->wp_fonts->do_items();
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
		$this->setup_integrated_deps( $setup, false );
		// Do not enqueue. Instead, pass the handles to WP_Fonts::do_items().
		$handles = $setup['enqueued'];
		$this->assertEmpty( $this->wp_fonts->queue, 'No fonts should be enqueued' );

		$this->expectOutputString( $expected_output );
		$actual_done = $this->wp_fonts->do_items( $handles );
		$this->assertSameSets( $expected_done, $actual_done, 'Printed handles should match' );
	}

	/**
	 * Sets up the dependencies for the mocked test.
	 *
	 * @param array $setup Dependencies to set up.
	 */
	private function setup_deps( array $setup ) {
		$setup = array_merge(
			array(
				'provider'         => array(),
				'provider_handles' => array(),
				'registered'       => array(),
				'enqueued'         => array(),
			),
			$setup
		);

		if ( ! empty( $setup['provider'] ) ) {
			foreach ( $setup['provider'] as $provider_id => $provider ) {
				$this->setup_provider_property_mock( $this->wp_fonts, $provider, $setup['provider_handles'][ $provider_id ] );
			}
		}

		if ( ! empty( $setup['registered'] ) ) {
			$this->setup_registration_mocks( $setup['registered'], $this->wp_fonts );
		}

		if ( ! empty( $setup['enqueued'] ) ) {
			$queue = $this->get_reflection_property( 'queue' );
			$queue->setValue( $this->wp_fonts, $setup['enqueued'] );
		}
	}

	/**
	 * Sets up the dependencies for integration test.
	 *
	 * @param array $setup   Dependencies to set up.
	 * @param bool  $enqueue Whether to enqueue. Default true.
	 */
	private function setup_integrated_deps( array $setup, $enqueue = true ) {
		foreach ( $setup['provider'] as $provider ) {
			$this->wp_fonts->register_provider( $provider['id'], $provider['class'] );
		}
		foreach ( $setup['registered'] as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $this->wp_fonts );
		}

		if ( $enqueue ) {
			$this->wp_fonts->enqueue( $setup['enqueued'] );
		}
	}
}
