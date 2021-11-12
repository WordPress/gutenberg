<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Provider_Registry
 */
class WP_Webfonts_Provider_Registry_Test extends WP_UnitTestCase {

	public static function setUpBeforeClass() {
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-provider-registry.php';
		require_once __DIR__ . '/mocks/class-my-custom-webfonts-provider-mock.php';
	}

	/**
	 * @covers WP_Webfonts_Provider_Registry::get_all_registered
	 */
	public function test_get_all_registered_when_empty() {
		$registry = new WP_Webfonts_Provider_Registry();

		$this->assertSame( array(), $registry->get_all_registered() );
	}

	/**
	 * @covers WP_Webfonts_Provider_Registry::register
	 * @covers WP_Webfonts_Provider_Registry::get_all_registered
	 */
	public function test_register_with_invalid_class() {
		$registry = new WP_Webfonts_Provider_Registry();
		$registry->register( 'DoesNotExist' );

		$this->assertSame( array(), $registry->get_all_registered() );
	}

	/**
	 * @covers WP_Webfonts_Provider_Registry::register
	 * @covers WP_Webfonts_Provider_Registry::get_all_registered
	 */
	public function test_register_with_valid_class() {
		$registry = new WP_Webfonts_Provider_Registry();
		$registry->register( My_Custom_Webfonts_Provider_Mock::class );

		$providers = $registry->get_all_registered();

		$this->assertIsArray( $providers );
		$this->assertCount( 1, $providers );
		$this->assertArrayHasKey( 'my-custom-provider', $providers );
		$this->assertInstanceOf( 'My_Custom_Webfonts_Provider_Mock', $providers['my-custom-provider'] );
	}

	/**
	 * @covers WP_Webfonts_Provider_Registry::init
	 * @covers WP_Webfonts_Provider_Registry::get_all_registered
	 */
	public function test_init() {
		$registry = new WP_Webfonts_Provider_Registry();
		// Register the core providers.
		$registry->init();

		$providers = $registry->get_all_registered();

		$expected = array( 'google', 'local' );
		$this->assertSame( $expected, array_keys( $providers ) );
		$this->assertInstanceOf( 'WP_Webfonts_Google_Provider', $providers['google'] );
		$this->assertInstanceOf( 'WP_Webfonts_Local_Provider', $providers['local'] );
	}

	/**
	 * @covers WP_Webfonts_Provider_Registry::register
	 * @covers WP_Webfonts_Provider_Registry::get_all_registered
	 */
	public function test_register_with_core_providers() {
		$registry = new WP_Webfonts_Provider_Registry();
		// Register the core providers.
		$registry->init();
		// Register a custom provider.
		$registry->register( My_Custom_Webfonts_Provider_Mock::class );

		$providers = $registry->get_all_registered();

		$expected = array( 'google', 'local', 'my-custom-provider' );
		$this->assertSame( $expected, array_keys( $providers ) );
	}
}
