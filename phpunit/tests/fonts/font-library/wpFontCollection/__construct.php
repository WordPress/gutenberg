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
			'name'        => 'My Collection',
			'description' => 'My collection description',
			'src'         => 'my-collection-data.json',
		);
		$collection = new WP_Font_Collection( 'my-collection', $config );

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
	public function test_should_do_it_wrong( $slug, $config ) {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::is_config_valid' );
		new WP_Font_Collection( $slug, $config );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_do_it_wrong() {
		return array(
			'with empty slug'                       => array(
				'slug'   => '',
				'config' => array(
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),

			'with wrong slug data type'             => array(
				'slug'   => true,
				'config' => array(
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),

			'with config as empty array'            => array(
				'slug'   => 'my-collection',
				'config' => array(),
			),

			'with wrong config data type'           => array(
				'slug'   => 'my-collection',
				'config' => true,
			),

			'with config missing name'              => array(
				'slug'   => 'my-collection',
				'config' => array(
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),

			'with config missing src'               => array(
				'slug'   => 'my-collection',
				'config' => array(
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
			),

			'with both src and font families'       => array(
				'slug'   => 'my-collection',
				'config' => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'src'           => 'my-collection-data.json',
					'font_families' => array( 'mock' ),
				),
			),

			'with empty families'                   => array(
				'slug'   => 'my-collection',
				'config' => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array(),
				),
			),

			'with font families wrong data type'    => array(
				'slug'   => 'my-collection',
				'config' => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => 'I am not an array',
				),
			),

			'with empty categories'                 => array(
				'slug'   => 'my-collection',
				'config' => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'src'           => 'my-collection-data.json',
					'font_families' => array( 'mock' ),
					'categories'    => array(),
				),
			),

			'with empty categories wrong data type' => array(
				'slug'   => 'my-collection',
				'config' => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'src'           => 'my-collection-data.json',
					'font_families' => array( 'mock' ),
					'categories'    => 'I am not an array',
				),
			),

		);
	}
}
