<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Registry
 */
class WP_Webfonts_Registry_Test extends WP_UnitTestCase {
	private $registry;
	private $validator_mock;

	public static function set_up_before_class() {
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-schema-validator.php';
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-registry.php';
	}

	public function set_up() {
		parent::set_up();

		$this->validator_mock = $this->getMockBuilder( 'WP_Webfonts_Schema_Validator' )->getMock();

		$this->registry = new WP_Webfonts_Registry( $this->validator_mock );
	}

	/**
	 * @covers WP_Webfonts_Registry::get_all_registered
	 */
	public function test_get_all_registered() {
		$expected = array(
			'open-sans.normal.400' => array(
				'provider'     => 'google',
				'font-family'  => 'Open Sans',
				'font-style'   => 'normal',
				'font-weight'  => '400',
				'font-display' => 'fallback',
			),
			'roboto.normal.900'    => array(
				'provider'     => 'google',
				'font-family'  => 'Robot',
				'font-style'   => 'normal',
				'font-weight'  => '900',
				'font-display' => 'fallback',
			),
		);

		/*
		 * Set the registry property.
		 * This is set in WP_Webfonts_Registry::register(), which not part of this test.
		 */
		$property = new ReflectionProperty( $this->registry, 'registered' );
		$property->setAccessible( true );
		$property->setValue( $this->registry, $expected );

		$this->assertSame( $expected, $this->registry->get_all_registered() );
	}

	/**
	 * @covers WP_Webfonts_Registry::register
	 *
	 * @dataProvider data_register_with_invalid_schema
	 *
	 * @param array $webfont Webfonts input.
	 */
	public function test_register_with_invalid_schema( array $webfont ) {
		$this->validator_mock
			->expects( $this->once() )
			->method( 'is_valid_schema' )
			->willReturn( false );
		$this->validator_mock
			->expects( $this->never() )
			->method( 'set_valid_properties' );

		$this->assertSame( '', $this->registry->register( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_register_with_invalid_schema() {
		return array(
			'empty array - no schema'   => array(
				array(),
			),
			'provider: not defined'     => array(
				array(
					'font_family' => 'Some Font',
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
			'provider: empty string'    => array(
				array(
					'provider'    => '',
					'font_family' => 'Some Font',
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
			'provider: not a string'    => array(
				array(
					'provider'    => null,
					'font_family' => 'Some Font',
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
			'font family: not defined'  => array(
				array(
					'provider'    => 'local',
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
			'font-family: not defined'  => array(
				array(
					'provider'    => 'some-provider',
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
			'font-family: empty string' => array(
				array(
					'provider'    => 'some-provider',
					'font_family' => '',
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
			'font-family: not a string' => array(
				array(
					'provider'    => 'some-provider',
					'font_family' => null,
					'font_style'  => 'normal',
					'font_weight' => '400',
				),
			),
		);
	}

	/**
	 * @covers WP_Webfonts_Registry::register
	 *
	 * @dataProvider data_register_with_valid_schema
	 *
	 * @param array  $webfont           Webfont input.
	 * @param array  $validated_webfont Webfont after being processed by the validator.
	 * @param string $expected          Expected return value.
	 */
	public function test_register_with_valid_schema( array $webfont, array $validated_webfont, $expected ) {
		$this->validator_mock
			->expects( $this->once() )
			->method( 'is_valid_schema' )
			->willReturn( true );
		$this->validator_mock
			->expects( $this->once() )
			->method( 'set_valid_properties' )
			->willReturn( $validated_webfont );

		$this->assertSame( $expected, $this->registry->register( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_register_with_valid_schema() {
		return array(
			'valid schema without font-display' => array(
				'webfont'           => array(
					'provider'    => 'google',
					'font_family' => 'Roboto',
					'font_style'  => 'normal',
					'font_weight' => 'normal',
				),
				'validated_webfont' => array(
					'provider'     => 'google',
					'font-family'  => 'Roboto',
					'font-style'   => 'normal',
					'font-weight'  => 'normal',
					'font-display' => 'fallback',
				),
				'expected'          => 'roboto.normal.normal',
			),
			'valid schema with src'             => array(
				'webfont'           => array(
					'provider'     => 'local',
					'font_family'  => 'Source Serif Pro',
					'font_style'   => 'normal',
					'font_weight'  => '200 900',
					'font_stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
				'validated_webfont' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
				'expected'          => 'source-serif-pro.normal.200 900',
			),
		);
	}

	/**
	 * @covers WP_Webfonts_Registry::get_by_provider
	 */
	public function test_get_by_provider_when_does_not_exist() {
		/*
		 * Set the `registry_by_provider` property.
		 * This is set in WP_Webfonts_Registry::register(), which not part of this test.
		 */
		$property = new ReflectionProperty( $this->registry, 'registry_by_provider' );
		$property->setAccessible( true );
		$property->setValue( $this->registry, array( 'google', 'local' ) );

		$this->assertSame( array(), $this->registry->get_by_provider( 'my-custom-provider' ) );
	}

	/**
	 * As there are many moving parts to getting by provider, this test is an integration
	 * test that does not mock.
	 *
	 * @covers WP_Webfonts_Registry::get_by_provider
	 * @covers WP_Webfonts_Registry::register
	 *
	 * @dataProvider data_get_by_provider_integrated
	 *
	 * @param array  $webfonts    Given webfont to register.
	 * @param string $provider_id Provider ID to query.
	 * @param array  $expected    Expected return value.
	 */
	public function test_get_by_provider_integrated( array $webfonts, $provider_id, array $expected ) {
		$registry = new WP_Webfonts_Registry( new WP_Webfonts_Schema_Validator() );

		foreach ( $webfonts as $webfont ) {
			$registry->register( $webfont );
		}

		$this->assertSame( $expected, $registry->get_by_provider( $provider_id ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_get_by_provider_integrated() {
		return array(
			'no webfonts for requested provider' => array(
				'webfonts'    => array(
					array(
						'provider'    => 'google',
						'font_family' => 'Lato',
						'font_style'  => 'italic',
						'font_weight' => '400',
					),
				),
				'provider_id' => 'local',
				'expected'    => array(),
			),
			'with one provider'                  => array(
				'webfonts'    => array(
					array(
						'provider'    => 'google',
						'font_family' => 'Lato',
						'font_style'  => 'italic',
						'font_weight' => '400',
					),
					array(
						'provider'    => 'google',
						'font_family' => 'Roboto',
						'font_style'  => 'normal',
						'font_weight' => '900',
					),
				),
				'provider_id' => 'google',
				'expected'    => array(
					'lato.italic.400'   => array(
						'provider'     => 'google',
						'font-family'  => 'Lato',
						'font-style'   => 'italic',
						'font-weight'  => '400',
						'font-display' => 'fallback',
					),
					'roboto.normal.900' => array(
						'provider'     => 'google',
						'font-family'  => 'Roboto',
						'font-style'   => 'normal',
						'font-weight'  => '900',
						'font-display' => 'fallback',
					),
				),
			),
			'with multiple providers'            => array(
				'webfonts'    => array(
					array(
						'provider'    => 'google',
						'font_family' => 'Open Sans',
						'font_style'  => 'normal',
						'font_weight' => '400',
					),
					array(
						'provider'     => 'local',
						'font_family'  => 'Source Serif Pro',
						'font_style'   => 'normal',
						'font_weight'  => '200 900',
						'font_stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					),
					array(
						'provider'    => 'google',
						'font_family' => 'Roboto',
						'font_style'  => 'normal',
						'font_weight' => '900',
					),
				),
				'provider_id' => 'local',
				'expected'    => array(
					'source-serif-pro.normal.200 900' => array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					),
				),
			),
		);
	}
}
