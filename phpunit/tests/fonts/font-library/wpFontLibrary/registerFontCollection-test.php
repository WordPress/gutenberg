<?php
/**
 * Test WP_Font_Library::register_font_collection().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Library::register_font_collection
 */
class Tests_Fonts_WpFontLibrary_RegisterFontCollection extends WP_UnitTestCase {

	public function test_should_register_font_collection() {
		$id         = 'my-collection';
		$config     = array(
			'name'           => 'My Collection',
			'description'    => 'My Collection Description',
			'data_json_file' => 'my-collection-data.json',
		);
		$collection = WP_Font_Library::register_font_collection( $id, $config );
		$this->assertInstanceOf( 'WP_Font_Collection', $collection );
	}

	public function test_should_return_error_if_id_is_missing() {
		$config     = array(
			'name'           => 'My Collection',
			'description'    => 'My Collection Description',
			'data_json_file' => 'my-collection-data.json',
		);
		$collection = WP_Font_Library::register_font_collection( '', $config );
		$this->assertInstanceOf( 'WP_Error', $collection );
	}

	public function test_should_return_error_if_config_is_missing() {
		$id         = 'my-other-collection';
		$collection = WP_Font_Library::register_font_collection( $id, '' );
		$this->assertInstanceOf( 'WP_Error', $collection );
	}

	public function test_should_return_error_if_config_is_empty() {
		$id         = 'my-other-collection';
		$collection = WP_Font_Library::register_font_collection( $id, array() );
		$this->assertInstanceOf( 'WP_Error', $collection );
	}

	public function test_should_return_error_if_id_is_repeated() {
		$id1     = 'my-collection-1';
		$config1 = array(
			'name'           => 'My Collection 1',
			'description'    => 'My Collection 1 Description',
			'data_json_file' => 'my-collection-1-data.json',
		);
		$config2 = array(
			'name'           => 'My Collection 2',
			'description'    => 'My Collection 2 Description',
			'data_json_file' => 'my-collection-2-data.json',
		);

		// Register first collection.
		$collection1 = WP_Font_Library::register_font_collection( $id1, $config1 );
		$this->assertInstanceOf( 'WP_Font_Collection', $collection1, 'A collection should be registered.' );

		// Try to register a second collection with same id.
		$collection2 = WP_Font_Library::register_font_collection( $id1, $config2 );
		$this->assertInstanceOf( 'WP_Error', $collection2, 'Second collection with the same id should fail.' );
	}
}
