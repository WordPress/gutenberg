<?php
/**
 * Test WP_Font_Family::__construct().
 *
 * @package WordPress
 * @subpackage Fonts Library
 *
 * @group fonts
 * @group fonts-library
 *
 * @covers WP_Font_Family::__construct
 */
class Tests_Fonts_WpFontFamily_Construct extends WP_UnitTestCase {

	public function test_should_initialize_data() {
		$property = new ReflectionProperty( WP_Font_Family::class, 'data' );
		$property->setAccessible( true );

		$font_data   = array(
			'fontFamily' => 'Piazzolla',
			'name'       => 'Piazzolla',
			'slug'       => 'piazzolla',
		);
		$font_family = new WP_Font_Family( $font_data );

		$actual = $property->getValue( $font_family );
		$property->setAccessible( false );

		$this->assertSame( $font_data, $actual );
	}

	/**
	 * @dataProvider data_should_throw_exception
	 *
	 * @param mixed $font_data Data to test.
	 */
	public function test_should_throw_exception( $font_data ) {
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( 'Font family data is missing the slug.' );

		new WP_Font_Family( $font_data );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_throw_exception() {
		return array(
			'no slug'                  => array(
				array(
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
				),
			),
			'empty array'              => array( array() ),
			'boolean instead of array' => array( false ),
			'null instead of array'    => array( null ),
		);
	}
}
