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
		$config     = array(
			'id'             => 'my-collection',
			'name'           => 'My Collection',
			'description'    => 'My Collection Description',
			'data_json_file' => 'my-collection-data.json',
		);
		$collection = WP_Font_Library::register_font_collection( $config );
		$this->assertInstanceOf( 'WP_Font_Collection', $collection );
	}

	public function test_should_return_error_if_id_is_missing() {
		$config = array(
			'name'           => 'My Collection',
			'description'    => 'My Collection Description',
			'data_json_file' => 'my-collection-data.json',
		);
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( 'Font Collection config ID is required as a non-empty string.' );
		WP_Font_Library::register_font_collection( $config );
	}

	public function test_should_return_error_if_name_is_missing() {
		$config = array(
			'id'             => 'my-collection',
			'description'    => 'My Collection Description',
			'data_json_file' => 'my-collection-data.json',
		);
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( 'Font Collection config name is required as a non-empty string.' );
		WP_Font_Library::register_font_collection( $config );
	}

	public function test_should_return_error_if_config_is_empty() {
		$config = array();
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( 'Font Collection config options is required as a non-empty array.' );
		WP_Font_Library::register_font_collection( $config );
	}

	public function test_should_return_error_if_id_is_repeated() {
		$config1 = array(
			'id'             => 'my-collection-1',
			'name'           => 'My Collection 1',
			'description'    => 'My Collection 1 Description',
			'data_json_file' => 'my-collection-1-data.json',
		);
		$config2 = array(
			'id'             => 'my-collection-1',
			'name'           => 'My Collection 2',
			'description'    => 'My Collection 2 Description',
			'data_json_file' => 'my-collection-2-data.json',
		);

		// Register first collection.
		$collection1 = WP_Font_Library::register_font_collection( $config1 );
		$this->assertInstanceOf( 'WP_Font_Collection', $collection1, 'A collection should be registered.' );

		// Try to register a second collection with same id.
		$collection2 = WP_Font_Library::register_font_collection( $config2 );
		$this->assertWPError( $collection2, 'Second collection with the same id should fail.' );
	}
}
