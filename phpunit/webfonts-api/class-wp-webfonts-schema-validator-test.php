<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Schema_Validator
 */
class WP_Webfonts_Schema_Validator_Test extends WP_UnitTestCase {
	private static $validator;

	public static function set_up_before_class() {
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-schema-validator.php';

		self::$validator = new WP_Webfonts_Schema_Validator();
	}

	/**
	 * @covers WP_Webfonts_Schema_Validator::is_valid_schema
	 *
	 * @dataProvider data_is_valid_schema_with_valid
	 *
	 * @param array $webfont Webfont input.
	 */
	public function test_is_valid_schema_with_valid( array $webfont ) {
		$this->assertTrue( self::$validator->is_valid_schema( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_is_valid_schema_with_valid() {
		return array(
			'basic schema' => array(
				array(
					'provider'    => 'google',
					'font-family' => 'Open Sans',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
			),
		);
	}

	/**
	 * @covers  WP_Webfonts_Schema_Validator::is_valid_schema
	 *
	 * @dataProvider data_is_valid_schema_with_invalid
	 *
	 * @param array  $webfont          Webfont input.
	 * @param string $expected_message Expected notice message.
	 */
	public function test_is_valid_schema_with_invalid( array $webfont, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertFalse( self::$validator->is_valid_schema( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_is_valid_schema_with_invalid() {
		return array(
			'empty array - no schema'             => array(
				'webfont'          => array(),
				'expected_message' => 'Webfont provider must be a non-empty string.',
			),
			'provider: not defined'               => array(
				'webfont'          => array(
					'font-family' => 'Some Font',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected_message' => 'Webfont provider must be a non-empty string.',
			),
			'provider: empty string'              => array(
				'webfont'          => array(
					'provider'    => '',
					'font-family' => 'Some Font',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected_message' => 'Webfont provider must be a non-empty string.',
			),
			'provider: not a string'              => array(
				'webfont'          => array(
					'provider'    => null,
					'font-family' => 'Some Font',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected_message' => 'Webfont provider must be a non-empty string.',
			),
			'font-family: not defined'            => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected_message' => 'Webfont font family must be a non-empty string.',
			),
			'font-family: empty string'           => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => '',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected_message' => 'Webfont font family must be a non-empty string.',
			),
			'font-family: not a string'           => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => null,
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected_message' => 'Webfont font family must be a non-empty string.',
			),
			'src: not defined'                    => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
				),
				'expected_message' => 'Webfont src must be a non-empty string or an array of strings.',
			),
			'src: type is invalid'                => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => null,
				),
				'expected_message' => 'Webfont src must be a non-empty string or an array of strings.',
			),
			'src: individual src is not a string' => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => array( null ),
				),
				'expected_message' => 'Each webfont src must be a non-empty string.',
			),
			'src: invalid url'                    => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => '/assets/fonts/font.woff2',
				),
				'expected_message' => 'Webfont src must be a valid URL or a data URI.',
			),
			'src: invalid data uri'               => array(
				'webfont'          => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => 'data:text/plain',
				),
				'expected_message' => 'Webfont src must be a valid URL or a data URI.',
			),
		);
	}

	/**
	 * @covers  WP_Webfonts_Schema_Validator::set_valid_properties
	 *
	 * @dataProvider data_set_valid_properties_with_valid_input
	 *
	 * @param array $webfont  Webfont input.
	 * @param array $expected Expected updated webfont.
	 */
	public function test_set_valid_properties_with_valid_input( array $webfont, array $expected ) {
		$this->assertSame( $expected, self::$validator->set_valid_properties( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_set_valid_properties_with_valid_input() {
		return array(
			'basic schema'                   => array(
				'webfont'  => array(
					'provider'    => 'google',
					'font-family' => 'Open Sans',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected' => array(
					'provider'     => 'google',
					'font-family'  => 'Open Sans',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
			'basic schema in opposite order' => array(
				'webfont'  => array(
					'font-weight' => '400',
					'font-style'  => 'normal',
					'font-family' => 'Open Sans',
					'provider'    => 'google',
				),
				'expected' => array(
					'provider'     => 'google',
					'font-family'  => 'Open Sans',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
			'src: with protocol'             => array(
				'webfont'  => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => 'http://example.org/assets/fonts/SourceSerif4Variable-Roman.ttf.woff2',
				),
				'expected' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'src'          => 'http://example.org/assets/fonts/SourceSerif4Variable-Roman.ttf.woff2',
				),
			),
			'src: without protocol'          => array(
				'webfont'  => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => '//example.org/assets/fonts/SourceSerif4Variable-Roman.ttf.woff2',
				),
				'expected' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'src'          => '//example.org/assets/fonts/SourceSerif4Variable-Roman.ttf.woff2',
				),
			),
			'src: data:'                     => array(
				'webfont'  => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'src'         => 'data:font/opentype; base64, SGVsbG8sIFdvcmxkIQ==',
				),
				'expected' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'src'          => 'data:font/opentype; base64, SGVsbG8sIFdvcmxkIQ==',
				),
			),
			'with font-stretch'              => array(
				'webfont'  => array(
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'provider'     => 'local',
				),
				'expected' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
			),
		);
	}

	/**
	 * @covers  WP_Webfonts_Schema_Validator::set_valid_properties
	 *
	 * @dataProvider data_set_valid_properties_with_invalid_input
	 *
	 * @param array $webfont  Webfont input.
	 * @param array $expected Expected updated webfont.
	 */
	public function test_set_valid_properties_with_invalid_input( array $webfont, array $expected ) {
		$this->assertSame( $expected, self::$validator->set_valid_properties( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_set_valid_properties_with_invalid_input() {
		return array(
			'empty array - no schema'          => array(
				'webfont'  => array(),
				'expected' => array(
					'provider'     => '',
					'font-family'  => '',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
			'with invalid @font-face property' => array(
				'webfont'  => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'invalid'     => 'should remove it',
				),
				'expected' => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
			'font-style: invalid value'        => array(
				'webfont'  => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'font-style'  => 'invalid',
				),
				'expected' => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
			'font-weight: invalid value'       => array(
				'webfont'  => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'font-weight' => 'invalid',
				),
				'expected' => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
			'font-display: invalid value'      => array(
				'webfont'  => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-display' => 'invalid',
				),
				'expected' => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
			),
		);
	}

	/**
	 * @covers WP_Webfonts_Schema_Validator::set_valid_properties
	 *
	 * @dataProvider data_set_valid_properties_with_invalid_and_error
	 *
	 * @param array  $webfont          Webfont input.
	 * @param array  $expected         Expected updated webfont.
	 * @param string $expected_message Expected notice message.
	 */
	public function test_set_valid_properties_with_invalid_and_error( array $webfont, array $expected, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertSame( $expected, self::$validator->set_valid_properties( $webfont ) );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_set_valid_properties_with_invalid_and_error() {
		return array(
			'font-style: empty value'   => array(
				'webfont'          => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'font-style'  => '',
				),
				'expected'         => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
				'expected_message' => 'Webfont font style must be a non-empty string.',
			),
			'font-style: not a string'  => array(
				'webfont'          => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'font-style'  => null,
				),
				'expected'         => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
				'expected_message' => 'Webfont font style must be a non-empty string.',
			),
			'font-weight: empty value'  => array(
				'webfont'          => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'font-weight' => '',
				),
				'expected'         => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
				'expected_message' => 'Webfont font weight must be a non-empty string.',
			),
			'font-weight: not a string' => array(
				'webfont'          => array(
					'provider'    => 'some-provider',
					'font-family' => 'Some Font',
					'font-weight' => true,
				),
				'expected'         => array(
					'provider'     => 'some-provider',
					'font-family'  => 'Some Font',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
				),
				'expected_message' => 'Webfont font weight must be a non-empty string.',
			),
		);
	}
}
