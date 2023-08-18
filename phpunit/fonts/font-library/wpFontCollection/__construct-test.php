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

		$id              = 'my-collection';
		$config          = array(
			'name'           => 'My Collection',
			'description'    => 'My collection description',
			'data_json_file' => 'my-collection-data.json',
		);
		$font_collection = new WP_Font_Collection( $id, $config );

		$actual = $property->getValue( $font_collection );
		$property->setAccessible( false );

		$expected       = $config;
		$expected['id'] = $id;

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @dataProvider data_should_throw_exception
	 *
	 * @param mixed  $id Id of the font collection.
	 * @param mixed  $config Config of the font collection.
	 * @param string $expected_exception_message Expected exception message.
	 */
	public function test_should_throw_exception( $id, $config, $expected_exception_message ) {
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( $expected_exception_message );

		new WP_Font_Collection( $id, $config );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_throw_exception() {
		return array(
			'no id'                           => array(
				'',
				array(
					'name'           => 'My Collection',
					'description'    => 'My collection description',
					'data_json_file' => 'my-collection-data.json',
				),
				'Font Collection is missing the id.',
			),

			'no config'                       => array(
				'my-collection',
				'',
				'Font Collection is missing the config.',
			),

			'empty array'                     => array(
				'my-collection',
				array(),
				'Font Collection is missing the config.',
			),

			'boolean instead of config array' => array(
				'my-collection',
				false,
				'Font Collection is missing the config.',
			),

			'null instead of config array'    => array(
				'my-collection',
				null,
				'Font Collection is missing the config.',
			),

		);
	}
}
