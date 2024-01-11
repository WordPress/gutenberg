<?php
/**
 * Test WP_Font_Collection::get_config().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::get_config
 */
class Tests_Fonts_WpFontCollection_GetConfig extends WP_UnitTestCase {
	/**
	 * @dataProvider data_should_get_config
	 *
	 * @param array $config Font collection config options.
	 * @param array $expected_data Expected data.
	 */
	public function test_should_get_config( $config, $expected_data ) {
		$collection = new WP_Font_Collection( $config );
		$this->assertSame( $expected_data, $collection->get_config() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_get_config() {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, '{"this is mock data":true}' );

		return array(
			'with a file' => array(
				'config'        => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'src'         => $mock_file,
				),
				'expected_data' => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
			),
			'with a url'  => array(
				'config'        => array(
					'slug'        => 'my-collection-with-url',
					'name'        => 'My Collection with URL',
					'description' => 'My collection description',
					'src'         => 'https://localhost/fonts/mock-font-collection.json',
				),
				'expected_data' => array(
					'slug'        => 'my-collection-with-url',
					'name'        => 'My Collection with URL',
					'description' => 'My collection description',
				),
			),
			'with data'   => array(
				'config'        => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'data'        => array( 'this is mock data' => true ),
				),
				'expected_data' => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
			),
		);
	}
}
