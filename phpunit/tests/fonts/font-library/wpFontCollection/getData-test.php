<?php
/**
 * Test WP_Font_Collection::get_data().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::get_data
 */
class Tests_Fonts_WpFontCollection_GetData extends WP_UnitTestCase {

	/**
	 * @dataProvider data_should_get_data
	 *
	 * @param array $config Font collection config options.
	 * @param array $expected_data Expected data.
	 */
	public function test_should_get_data( $config, $expected_data ) {
		$collection = new WP_Font_Collection( $config );
		$this->assertSame( $expected_data, $collection->get_data() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_get_data() {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, '{"this is mock data":true}' );

		return array(
			'with a data_json_file' => array(
				'config'        => array(
					'id'             => 'my-collection',
					'name'           => 'My Collection',
					'description'    => 'My collection description',
					'data_json_file' => $mock_file,
				),
				'expected_data' => array(
					'id'          => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'data'        => '{"this is mock data":true}',
				),
			),
		);
	}
}
