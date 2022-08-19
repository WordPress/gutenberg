<?php
/**
 * WP_Webfonts::get_providers() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';
require_once __DIR__ . '/../../fixtures/mock-provider.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::get_providers
 */
class Tests_Webfonts_WpWebfonts_GetProviders extends WP_Webfonts_TestCase {
	private $wp_webfonts;
	private $providers_property;

	public function set_up() {
		parent::set_up();
		$this->wp_webfonts = new WP_Webfonts();

		$this->providers_property = new ReflectionProperty( WP_Webfonts::class, 'providers' );
		$this->providers_property->setAccessible( true );
	}

	public function test_should_be_empty() {
		$actual = $this->wp_webfonts->get_providers();
		$this->assertIsArray( $actual, 'Should return an empty array' );
		$this->assertEmpty( $actual, 'Should return an empty array when no providers are registered' );
	}

	/**
	 * @dataProvider data_get_providers
	 *
	 * @param array $providers Array of providers to test.
	 * @param array $expected  Expected results.
	 */
	public function test_get_providers( array $providers, array $expected ) {
		$this->setup_providers( $providers );
		$this->assertSame( $expected, $this->wp_webfonts->get_providers() );
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

		$this->providers_property->setValue( $this->wp_webfonts, $data );
	}
}
