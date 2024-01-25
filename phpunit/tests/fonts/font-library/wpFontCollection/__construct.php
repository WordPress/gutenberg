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
		$slug = new ReflectionProperty( WP_Font_Collection::class, 'slug' );
		$slug->setAccessible( true );

		$name = new ReflectionProperty( WP_Font_Collection::class, 'name' );
		$name->setAccessible( true );

		$description = new ReflectionProperty( WP_Font_Collection::class, 'description' );
		$description->setAccessible( true );

		$src = new ReflectionProperty( WP_Font_Collection::class, 'src' );
		$src->setAccessible( true );

		$config     = array(
			'slug'        => 'my-collection',
			'name'        => 'My Collection',
			'description' => 'My collection description',
			'src'         => 'my-collection-data.json',
		);
		$collection = new WP_Font_Collection( $config );

		$actual_slug = $slug->getValue( $collection );
		$this->assertSame( 'my-collection', $actual_slug, 'Provided slug and initialized slug should match.' );
		$slug->setAccessible( false );

		$actual_name = $name->getValue( $collection );
		$this->assertSame( 'My Collection', $actual_name, 'Provided name and initialized name should match.' );
		$name->setAccessible( false );

		$actual_description = $description->getValue( $collection );
		$this->assertSame( 'My collection description', $actual_description, 'Provided description and initialized description should match.' );
		$description->setAccessible( false );

		$actual_src = $src->getValue( $collection );
		$this->assertSame( 'my-collection-data.json', $actual_src, 'Provided src and initialized src should match.' );
		$src->setAccessible( false );
	}

	/**
	 * @dataProvider data_should_do_it_wrong
	 *
	 * @param mixed  $config Config of the font collection.
	 */
	public function test_should_do_it_wrong( $config ) {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::is_config_valid' );
		new WP_Font_Collection( $config );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_do_it_wrong() {
		return array(
			'no id'                           => array(
				array(
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),

			'no config'                       => array(
				'',
			),

			'empty array'                     => array(
				array(),
			),

			'boolean instead of config array' => array(
				false,
			),

			'null instead of config array'    => array(
				null,
			),

			'missing src'                     => array(
				array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
			),
		);
	}
}
