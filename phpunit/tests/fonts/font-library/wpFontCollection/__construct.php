<?php
/**
 * Test WP_Font_Collection::__construct().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::__construct
 */
class Tests_Fonts_WpFontCollection_Construct extends WP_UnitTestCase {

	public function test_should_initialize_data() {
		$property = new ReflectionProperty( WP_Font_Collection::class, 'config' );
		$property->setAccessible( true );

		$config          = array(
			'id'             => 'my-collection',
			'name'           => 'My Collection',
			'description'    => 'My collection description',
			'data_json_file' => 'my-collection-data.json',
		);
		$font_collection = new WP_Font_Collection( $config );

		$actual = $property->getValue( $font_collection );
		$property->setAccessible( false );

		$this->assertSame( $config, $actual );
	}

	/**
	 * @dataProvider data_should_throw_exception
	 *
	 * @param mixed  $config Config of the font collection.
	 * @param string $expected_exception_message Expected exception message.
	 */
	public function test_should_throw_exception( $config, $expected_exception_message ) {
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( $expected_exception_message );
		new WP_Font_Collection( $config );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_throw_exception() {
		return array(
			'no id'                           => array(
				array(
					'name'           => 'My Collection',
					'description'    => 'My collection description',
					'data_json_file' => 'my-collection-data.json',
				),
				'Font Collection config ID is required as a non-empty string.',
			),

			'no config'                       => array(
				'',
				'Font Collection config options is required as a non-empty array.',
			),

			'empty array'                     => array(
				array(),
				'Font Collection config options is required as a non-empty array.',
			),

			'boolean instead of config array' => array(
				false,
				'Font Collection config options is required as a non-empty array.',
			),

			'null instead of config array'    => array(
				null,
				'Font Collection config options is required as a non-empty array.',
			),

			'missing data_json_file'          => array(
				array(
					'id'          => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
				'Font Collection config "data_json_file" option is required as a non-empty string.',
			),

		);
	}
}
