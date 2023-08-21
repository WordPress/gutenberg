<?php
/**
 * WP_Fonts::do_item() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @group  printfonts
 * @covers WP_Fonts::do_item
 */
class Tests_Fonts_WpFonts_DoItem extends WP_Fonts_TestCase {
	private $wp_fonts;

	public function set_up() {
		parent::set_up();
		$this->wp_fonts = new WP_Fonts;
	}

	public function test_should_return_false_when_provider_not_registered() {
		$this->assertFalse( $this->wp_fonts->do_item( 'provider_not_registered' ) );
	}

	/**
	 * @dataProvider data_provider_definitions
	 *
	 * @param array $provider Provider to mock.
	 */
	public function test_should_return_false_when_no_fonts_enqueued_for_provider( array $provider ) {
		$this->setup_provider_property_mock( $this->wp_fonts, $provider );
		$this->assertFalse( $this->wp_fonts->do_item( $provider['id'] ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_provider_definitions() {
		$providers = $this->get_provider_definitions();

		return array(
			'mock'  => array( $providers['mock'] ),
			'local' => array( $providers['local'] ),
		);
	}

	/**
	 * Test the test set up to ensure the `Tests_Fonts_WpFonts_DoItem_::setup_provider_property_mock()`
	 * method works as expected.
	 */
	public function test_mocking_providers_property() {
		$font_handles = array( 'font1', 'font2', 'font3' );
		$expected     = array(
			'mock' => array(
				'class' => Mock_Provider::class,
				'fonts' => $font_handles,
			),
		);

		$this->setup_provider_property_mock( $this->wp_fonts, $this->get_provider_definitions( 'mock' ), $font_handles );
		$actual = $this->property['WP_Fonts::$providers']->getValue( $this->wp_fonts );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * Test the private method WP_Fonts::get_enqueued_fonts_for_provider().
	 *
	 * Why? This test validates the right fonts are returned for use within
	 * WP_Fonts::do_item().
	 *
	 * @dataProvider data_get_enqueued_fonts_for_provider
	 *
	 * @param array $font_handles Array of handles for the provider.
	 * @param array $to_do        Handles to set for the WP_Fonts::$to_do property.
	 * @param array $expected     Expected result.
	 */
	public function test_get_enqueued_fonts_for_provider( $font_handles, $to_do, $expected ) {
		// Set up the `to_do` property.
		$this->wp_fonts->to_do = $to_do;

		// Open the method's visibility for testing.
		$get_enqueued_fonts_for_provider = $this->get_reflection_method( 'get_enqueued_fonts_for_provider' );

		// Mock the WP_Fonts::$property to set up the test.
		$this->setup_provider_property_mock( $this->wp_fonts, $this->get_provider_definitions( 'mock' ), $font_handles );

		$actual = $get_enqueued_fonts_for_provider->invoke( $this->wp_fonts, 'mock' );
		$this->assertSameSets( $expected, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_enqueued_fonts_for_provider() {
		return array(
			'to_do queue is empty'                   => array(
				'font_handles ' => array( 'font1', 'font2', 'font3' ),
				'to_do'         => array(),
				'expected'      => array(),
			),
			'fonts not in to_do queue'               => array(
				'font_handles ' => array( 'font1', 'font2', 'font3' ),
				'to_do'         => array( 'font12', 'font13' ),
				'expected'      => array(),
			),
			'2 of the provider fonts in to_do queue' => array(
				'font_handles ' => array( 'font11', 'font12', 'font13' ),
				'to_do'         => array( 'font11', 'font13' ),
				'expected'      => array( 'font11', 'font13' ),
			),
			'do all of the provider fonts'           => array(
				'font_handles ' => array( 'font21', 'font22', 'font23' ),
				'to_do'         => array( 'font21', 'font22', 'font23' ),
				'expected'      => array( 'font21', 'font22', 'font23' ),
			),
		);
	}

	/**
	 * Test the private method WP_Fonts::get_font_properties_for_provider().
	 *
	 * Why? This test validates the right font properties are returned for use within
	 * WP_Fonts::do_item().
	 *
	 * @dataProvider data_get_font_properties_for_provider
	 *
	 * @param array $font_handles Web fonts for testing.
	 * @param array $expected     Expected result.
	 */
	public function test_get_font_properties_for_provider( $font_handles, $expected ) {
		// Set up the fonts for WP_Dependencies:get_data().
		$fonts = $this->get_registered_fonts();
		// Set all variations to 'mock' provider.

		// Mock the WP_Fonts::$property to set up the test.
		$this->setup_provider_property_mock( $this->wp_fonts, $this->get_provider_definitions( 'mock' ), $font_handles );
		$this->setup_registration_mocks( $fonts, $this->wp_fonts );

		// Open the method's visibility for testing.
		$method = $this->get_reflection_method( 'get_font_properties_for_provider' );

		$actual = $method->invoke( $this->wp_fonts, $font_handles );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_font_properties_for_provider() {
		$fonts = $this->get_registered_fonts();

		return array(
			'handles not registered'                => array(
				'font_handles' => array( 'font-not-registered1', 'font-not-registered2', 'font-not-registered3' ),
				'expected'     => array(),
			),
			'registered and non-registered handles' => array(
				'font_handles' => array( 'Source Serif Pro-300-normal', 'not-registered-handle', 'Source Serif Pro-900-italic' ),
				'expected'     => array(
					'Source Serif Pro-300-normal' => $fonts['Source Serif Pro']['Source Serif Pro-300-normal'],
					'Source Serif Pro-900-italic' => $fonts['Source Serif Pro']['Source Serif Pro-900-italic'],
				),
			),
			'font-family handles, ie no "font-properties" extra data' => array(
				'font_handles' => array( 'font1', 'font2', 'merriweather' ),
				'expected'     => array(),
			),
		);
	}

	/**
	 * @dataProvider data_print_enqueued_fonts
	 *
	 * @param array $provider Define provider.
	 * @param array $fonts    Fonts to register and enqueue.
	 * @param array $expected Expected results.
	 */
	public function test_should_trigger_provider_when_mocked( array $provider, array $fonts, array $expected ) {
		$this->setup_print_deps( $provider, $fonts );

		$provider_mock = $this->setup_object_mock( array( 'set_fonts', 'print_styles' ), $provider['class'] );

		// Test the provider's methods are invoked.
		$provider_mock->expects( $this->once() )->method( 'set_fonts' )->with( $this->identicalTo( $expected['set_fonts'] ) );
		$provider_mock->expects( $this->once() )->method( 'print_styles' );

		// Set up the WP_Fonts::$provider_instances property.
		$provider_instances = $this->get_reflection_property( 'provider_instances' );
		$provider_instances->setValue( $this->wp_fonts, array( $provider['id'] => $provider_mock ) );

		// Test the method successfully processes the provider.
		$this->expectOutputString( '' );
		$this->assertTrue( $this->wp_fonts->do_item( $provider['id'] ), 'WP_Fonts::do_item() should return true' );
	}

	/**
	 * Integration test.
	 *
	 * @dataProvider data_print_enqueued_fonts
	 *
	 * @param array $provider Define provider.
	 * @param array $fonts    Fonts to register and enqueue.
	 * @param array $expected Expected results.
	 */
	public function test_should_print( array $provider, array $fonts, array $expected ) {
		$this->setup_print_deps( $provider, $fonts );

		// Test the method successfully processes the provider.
		$this->expectOutputString( $expected['printed_output'] );
		$this->assertTrue( $this->wp_fonts->do_item( $provider['id'] ), 'WP_Fonts::do_item() should return true' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_print_enqueued_fonts() {
		$mock       = $this->get_registered_mock_fonts();
		$local      = $this->get_registered_local_fonts();
		$font_faces = $this->get_registered_fonts_css();

		return array(
			'mock'  => array(
				'provider' => $this->get_provider_definitions( 'mock' ),
				'fonts'    => $mock,
				'expected' => array(
					'set_fonts'      => array_merge( $mock['font1'], $mock['font2'], $mock['font3'] ),
					'printed_output' => sprintf(
						'<mock id="wp-fonts-mock" attr="some-attr">%s; %s; %s; %s; %s; %s</mock>\n',
						$font_faces['font1-300-normal'],
						$font_faces['font1-300-italic'],
						$font_faces['font1-900-normal'],
						$font_faces['font2-200-900-normal'],
						$font_faces['font2-200-900-italic'],
						$font_faces['font3-bold-normal']
					),
				),
			),
			'local' => array(
				'provider' => $this->get_provider_definitions( 'local' ),
				'fonts'    => $local,
				'expected' => array(
					'set_fonts'      => array_merge( $local['merriweather'], $local['Source Serif Pro'] ),
					'printed_output' => sprintf(
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
	 * Integration test.
	 *
	 * @dataProvider data_not_print_enqueued_fonts
	 *
	 * @param array $provider    Define provider.
	 * @param array $fonts       Fonts to register and enqueue.
	 * @param array $expected    Not used.
	 * @param array $to_do_queue Value to set in the WP_Fonts::$to_do queue.
	 */
	public function test_should_not_print_when_to_do_queue_empty( array $provider, array $fonts, $expected, $to_do_queue ) {
		$this->setup_print_deps( $provider, $fonts, $to_do_queue );

		// Test the method successfully processes the provider.
		$this->expectOutputString( '' );
		$this->assertFalse( $this->wp_fonts->do_item( $provider['id'] ), 'WP_Fonts::do_item() should return false' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_not_print_enqueued_fonts() {
		$mock  = $this->get_registered_mock_fonts();
		$local = $this->get_registered_local_fonts();

		return array(
			'mock provider when to_do queue is empty'  => array(
				'provider'    => $this->get_provider_definitions( 'mock' ),
				'fonts'       => $mock,
				'expected'    => array(),
				'to_do_queue' => array(),
			),
			'local provider when to_do queue is empty' => array(
				'provider'    => $this->get_provider_definitions( 'local' ),
				'fonts'       => $local,
				'expected'    => array(),
				'to_do_queue' => array(),
			),
			'fonts not in to_do queue'                 => array(
				'provider'    => $this->get_provider_definitions( 'mock' ),
				'fonts'       => $mock,
				'expected'    => array(),
				'to_do_queue' => array(),
			),
		);
	}

	/**
	 * Sets up the print dependencies.
	 *
	 * @param array      $provider    Provider id and class.
	 * @param array      $fonts       Fonts to register and enqueue.
	 * @param array|null $to_do_queue Set the WP_Fonts:$to_do queue.
	 */
	private function setup_print_deps( $provider, $fonts, $to_do_queue = null ) {
		// Set up the fonts for WP_Dependencies:get_data().
		$mocks   = $this->setup_registration_mocks( $fonts, $this->wp_fonts );
		$handles = array_keys( $mocks );
		$this->setup_provider_property_mock( $this->wp_fonts, $provider, $handles );

		// Set up the `WP_Fonts::$to_do` and `WP_Fonts::$to_do_keyed_handles` properties.
		if ( null === $to_do_queue ) {
			$to_do_queue = $handles;
		}

		$this->wp_fonts->to_do = $to_do_queue;
		$to_do_keyed_handles   = $this->get_reflection_property( 'to_do_keyed_handles' );
		$to_do_keyed_handles->setValue( $this->wp_fonts, array_flip( $to_do_queue ) );
	}
}
