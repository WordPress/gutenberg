<?php
/**
 * Unit tests for wp_register_font_provider().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';
require_once __DIR__ . '/../fixtures/mock-provider.php';

/**
 * @group  fontsapi
 * @covers ::wp_register_font_provider
 */
class Tests_Fonts_WpRegisterFontProvider extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_register_providers
	 *
	 * @param string $provider_id Provider ID.
	 * @param string $class       Provider class name.
	 */
	public function test_should_register_provider( $provider_id, $class ) {
		$mock = $this->set_up_mock( 'register_provider' );
		$mock->expects( $this->once() )
			->method( 'register_provider' )
			->with(
				$this->identicalTo( $provider_id ),
				$this->identicalTo( $class )
			)
			->will( $this->returnValue( true ) );

		$this->assertTrue( wp_register_font_provider( $provider_id, $class ), 'wp_register_font_provider() should return true' );
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
			),
			'local' => array(
				'provider_id' => 'local',
				'class'       => WP_Fonts_Provider_Local::class,
			),
		);
	}

	/**
	 * @dataProvider data_invalid_providers
	 *
	 * @param string $provider_id Provider ID.
	 * @param string $class       Provider class name.
	 */
	public function test_should_not_register( $provider_id, $class ) {
		$mock = $this->set_up_mock( 'register_provider' );
		$mock->expects( $this->once() )
			->method( 'register_provider' )
			->with(
				$this->identicalTo( $provider_id ),
				$this->identicalTo( $class )
			)
			->will( $this->returnValue( false ) );

		$this->assertFalse( wp_register_font_provider( $provider_id, $class ), 'wp_register_font_provider() should return false' );

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
