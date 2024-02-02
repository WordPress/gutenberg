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

	/**
	 * @dataProvider data_should_assign_properties_from_php_config
	 *
	 * @param string $slug          Font collection slug.
	 * @param array  $config        Font collection config options.
	 * @param array  $expected_data Expected output data.
	 */
	public function test_should_assign_properties_from_php_config( $slug, $config, $expected_data ) {
		$collection = new WP_Font_Collection( $slug, $config );
		$data       = array(
			'slug'          => $collection->slug,
			'name'          => $collection->name,
			'description'   => $collection->description,
			'font_families' => $collection->font_families,
			'categories'    => $collection->categories,
		);
		$this->assertSame( $expected_data, $data );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_assign_properties_from_php_config() {
		return array(
			'with font_families and categories'     => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( 'mock' ),
					'categories'    => array( 'mock' ),
				),
				'expected_data' => array(
					'slug'          => 'my-collection',
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( 'mock' ),
					'categories'    => array( 'mock' ),
				),
			),
			'with font_families without categories' => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( 'mock' ),
				),
				'expected_data' => array(
					'slug'          => 'my-collection',
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( 'mock' ),
					'categories'    => array(),
				),
			),
		);
	}

	public function test_should_do_it_wrong_missing_font_families() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::__construct' );
		new WP_Font_Collection( 'my-collection' );
	}

	public function test_should_do_it_wrong_invalid_slug() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::__construct' );
		new WP_Font_Collection( 'slug with spaces', array( 'font_families' => array( 'mock' ) ) );
	}
}
