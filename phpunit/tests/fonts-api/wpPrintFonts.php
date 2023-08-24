<?php
/**
 * Unit and integration tests for wp_print_fonts().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/base.php';
require_once GUTENBERG_DIR_TESTFIXTURES . '/mock-provider.php';

/**
 * @group  fontsapi
 * @covers ::wp_print_fonts
 */
class Tests_Fonts_WpPrintFonts extends WP_Fonts_TestCase {

	public static function set_up_before_class() {
		self::$requires_switch_theme_fixtures = true;

		parent::set_up_before_class();

		static::set_up_admin_user();
	}

	public function test_should_return_empty_array_when_no_fonts_registered() {
		$this->assertSame( array(), wp_print_fonts() );
	}

	/**
	 * Unit test which mocks WP_Fonts methods.
	 *
	 * @dataProvider data_mocked_handles
	 *
	 * @param string|string[] $handles Handles to test.
	 */
	public function test_should_return_mocked_handles( $handles ) {
		$mock = $this->set_up_mock( array( 'get_registered_font_families', 'do_items' ) );
		$mock->expects( $this->once() )
			->method( 'get_registered_font_families' )
			->will( $this->returnValue( $handles ) );

		$mock->expects( $this->once() )
			->method( 'do_items' )
			->with(
				$this->identicalTo( $handles )
			)
			->will( $this->returnValue( $handles ) );

		wp_print_fonts( $handles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_mocked_handles() {
		return array(
			'font family'            => array(
				array( 'my-custom-font' ),
			),
			'multiple font families' => array(
				array(
					'font1',
					'font2',
				),
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
	 * @dataProvider data_should_print_all_registered_fonts_for_iframed_editor
	 *
	 * @param string $fonts    Fonts to register.
	 * @param array  $expected Expected results.
	 */
	public function test_should_print_all_registered_fonts_for_iframed_editor( $fonts, $expected ) {
		wp_register_fonts( $fonts );

		$this->expectOutputString( $expected['output'] );
		$actual_done = wp_print_fonts( true );
		$this->assertSameSets( $expected['done'], $actual_done, 'All registered font-family handles should be returned' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_print_all_registered_fonts_for_iframed_editor() {
		$local_fonts = $this->get_registered_local_fonts();
		$font_faces  = $this->get_registered_fonts_css();

		return array(
			'Merriweather with 1 variation'      => array(
				'fonts'    => array( 'merriweather' => $local_fonts['merriweather'] ),
				'expected' => array(
					'done'   => array( 'merriweather', 'merriweather-200-900-normal' ),
					'output' => sprintf(
						"<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
						$font_faces['merriweather-200-900-normal']
					),
				),
			),
			'Source Serif Pro with 2 variations' => array(
				'fonts'    => array( 'Source Serif Pro' => $local_fonts['Source Serif Pro'] ),
				'expected' => array(
					'done'   => array( 'source-serif-pro', 'Source Serif Pro-300-normal', 'Source Serif Pro-900-italic' ),
					'output' => sprintf(
						"<style id='wp-fonts-local' type='text/css'>\n%s%s\n</style>\n",
						$font_faces['Source Serif Pro-300-normal'],
						$font_faces['Source Serif Pro-900-italic']
					),
				),
			),
			'all fonts'                          => array(
				'fonts'    => $local_fonts,
				'expected' => array(
					'done'   => array(
						'merriweather',
						'merriweather-200-900-normal',
						'source-serif-pro',
						'Source Serif Pro-300-normal',
						'Source Serif Pro-900-italic',
					),
					'output' => sprintf(
						"<style id='wp-fonts-local' type='text/css'>\n%s%s%s\n</style>\n",
						$font_faces['merriweather-200-900-normal'],
						$font_faces['Source Serif Pro-300-normal'],
						$font_faces['Source Serif Pro-900-italic']
					),
				),
			),
		);
	}

	/**
	 * Integration test for printing user-selected global fonts.
	 * This test registers providers and fonts and then enqueues before testing the printing functionality.
	 *
	 * @dataProvider data_print_user_selected_fonts
	 *
	 * @param array  $global_styles   Test set up information for provider, fonts, and enqueued.
	 * @param array  $expected_done   Expected array of printed handles.
	 * @param string $expected_output Expected printed output.
	 */
	public function test_should_print_user_selected_fonts( $global_styles, $expected_done, $expected_output ) {
		$wp_fonts = wp_fonts();

		$setup = array(
			'provider'      => array( 'mock' => $this->get_provider_definitions( 'mock' ) ),
			'registered'    => $this->get_registered_mock_fonts(),
			'global_styles' => $global_styles,
		);
		$this->setup_integrated_deps( $setup, $wp_fonts, false );

		$this->expectOutputString( $expected_output );
		$actual_printed_fonts = wp_print_fonts();
		$this->assertSameSets( $expected_done, $actual_printed_fonts, 'Should print font-faces for given user-selected fonts' );
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

		if ( ! empty( $setup['global_styles'] ) ) {
			$this->set_up_global_styles( $setup['global_styles'] );
		}
	}
}
