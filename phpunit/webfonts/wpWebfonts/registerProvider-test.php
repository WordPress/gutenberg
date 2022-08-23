<?php
/**
 * WP_Webfonts::register_provider() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';
require_once __DIR__ . '/../../fixtures/mock-provider.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::register_provider
 */
class Tests_Webfonts_WpWebfonts_RegisterProvider extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_register_providers
	 *
	 * @param string $provider_id Provider ID.
	 * @param string $class       Provider class name.
	 * @param array  $expected    Expected providers queue.
	 */
	public function test_should_register_provider( $provider_id, $class, $expected ) {
		$wp_webfonts = new WP_Webfonts();
		$this->assertTrue( $wp_webfonts->register_provider( $provider_id, $class ), 'WP_Webfonts::register_provider() should return true' );
		$this->assertSame( $expected, $wp_webfonts->get_providers(), 'Provider "' . $provider_id . '" should be registered in providers queue' );
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
				'class'       => WP_Webfonts_Provider_Local::class,
				'expected'    => array(
					'local' => array(
						'class' => WP_Webfonts_Provider_Local::class,
						'fonts' => array(),
					),
				),
			),
		);
	}

	public function test_should_register_mutliple_providers() {
		$wp_webfonts = new WP_Webfonts();
		$providers   = $this->get_provider_definitions();
		foreach ( $providers as $provider ) {
			$this->assertTrue( $wp_webfonts->register_provider( $provider['id'], $provider['class'] ), 'WP_Webfonts::register_provider() should return true for provider ' . $provider['id'] );
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

		$this->assertSame( $expected, $wp_webfonts->get_providers(), 'Both local and mock providers should be registered' );
	}

	/**
	 * @dataProvider data_invalid_providers
	 *
	 * @param string $provider_id Provider ID.
	 * @param string $class       Provider class name.
	 */
	public function test_should_not_register( $provider_id, $class ) {
		$wp_webfonts = new WP_Webfonts();

		$this->assertFalse( $wp_webfonts->register_provider( $provider_id, $class ), 'WP_Webfonts::register_provider() should return false' );
		$this->assertArrayNotHasKey( $provider_id, $wp_webfonts->get_providers(), 'Both local and mock providers should be registered' );
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
