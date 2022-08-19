<?php
/**
 * Unit and integration tests for wp_get_webfont_providers().
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';
require_once __DIR__ . '/../fixtures/mock-provider.php';

/**
 * @group  webfonts
 * @covers ::wp_get_webfont_providers
 */
class Tests_Webfonts_WpGetWebfontProviders extends WP_Webfonts_TestCase {
	private $providers_property;

	public function set_up() {
		parent::set_up();
		$this->providers_property = new ReflectionProperty( WP_Webfonts::class, 'providers' );
		$this->providers_property->setAccessible( true );
	}

	/**
	 * Unit test.
	 *
	 * @dataProvider data_get_providers
	 *
	 * @param array $providers Not used.
	 * @param array $expected  Expected results.
	 */
	public function test_should_return_mocked_providers( array $providers, array $expected ) {
		$mock = $this->set_up_mock( 'get_providers' );
		$mock->expects( $this->once() )
			->method( 'get_providers' )
			->will( $this->returnValue( $expected ) );

		$this->assertSame( $expected, wp_get_webfont_providers() );
	}

	/**
	 * Integration test that sets the `WP_Webfonts::providers` property.
	 *
	 * @dataProvider data_get_providers
	 *
	 * @param array $providers Array of providers to test.
	 * @param array $expected  Expected results.
	 */
	public function test_should_return_providers( array $providers, array $expected ) {
		$this->setup_providers( $providers );
		$this->assertSame( $expected, wp_get_webfont_providers() );
	}

	/**
	 * Sets up the given providers and stores them in the `WP_Webfonts::providers` property.
	 *
	 * @param array $providers Array of providers to set up.
	 */
	private function setup_providers( array $providers ) {
		$data = array();

		foreach ( $providers as $provider_id => $class ) {
			$data[ $provider_id ] = array(
				'class' => $class,
				'fonts' => array(),
			);
		}

		$this->providers_property->setValue( wp_webfonts(), $data );
	}
}
