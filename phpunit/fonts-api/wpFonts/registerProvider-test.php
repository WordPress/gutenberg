<?php
/**
 * WP_Fonts::register_provider() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';
require_once __DIR__ . '/../../fixtures/mock-provider.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::register_provider
 */
class Tests_Fonts_WpFonts_RegisterProvider extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_register_providers
	 *
	 * @param string $provider_id Provider ID.
	 * @param string $class       Provider class name.
	 * @param array  $expected    Expected providers queue.
	 */
	public function test_should_register_provider( $provider_id, $class, $expected ) {
		$wp_fonts = new WP_Fonts();
		$this->assertTrue( $wp_fonts->register_provider( $provider_id, $class ), 'WP_Fonts::register_provider() should return true' );
		$this->assertSame( $expected, $wp_fonts->get_providers(), 'Provider "' . $provider_id . '" should be registered in providers queue' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_register_providers() {
		return array(
			'mock'  => array(
				'provider_id' => 'mock',
				'class'       => Mock_Provider::class,
				'expected'    => array(
					'mock' => array(
						'class' => Mock_Provider::class,
						'fonts' => array(),
					),
				),
			),
			'local' => array(
				'provider_id' => 'local',
				'class'       => WP_Fonts_Provider_Local::class,
				'expected'    => array(
					'local' => array(
						'class' => WP_Fonts_Provider_Local::class,
						'fonts' => array(),
					),
				),
			),
		);
	}

	public function test_should_register_mutliple_providers() {
		$wp_fonts  = new WP_Fonts();
		$providers = $this->get_provider_definitions();
		foreach ( $providers as $provider ) {
			$this->assertTrue( $wp_fonts->register_provider( $provider['id'], $provider['class'] ), 'WP_Fonts::register_provider() should return true for provider ' . $provider['id'] );
		}

		$expected = array(
			'mock'  => array(
				'class' => $providers['mock']['class'],
				'fonts' => array(),
			),
			'local' => array(
				'class' => $providers['local']['class'],
				'fonts' => array(),
			),
		);

		$this->assertSame( $expected, $wp_fonts->get_providers(), 'Both local and mock providers should be registered' );
	}

	/**
	 * @dataProvider data_invalid_providers
	 *
	 * @param string $provider_id Provider ID.
	 * @param string $class       Provider class name.
	 */
	public function test_should_not_register( $provider_id, $class ) {
		$wp_fonts = new WP_Fonts();

		$this->assertFalse( $wp_fonts->register_provider( $provider_id, $class ), 'WP_Fonts::register_provider() should return false' );
		$this->assertArrayNotHasKey( $provider_id, $wp_fonts->get_providers(), 'Both local and mock providers should be registered' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_providers() {
		return array(
			'provider_id is empty' => array(
				'provider_id' => '',
				'class'       => Mock_Provider::class,
			),
			'class is empty'       => array(
				'provider_id' => 'local',
				'class'       => '',
			),
			'class does not exist' => array(
				'provider_id' => 'doesnotexist',
				'class'       => 'Provider_Does_Not_Exist',
			),
		);
	}
}
