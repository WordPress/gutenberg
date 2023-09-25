<?php
/**
 * Test WP_Font_Library::get_font_collections().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Library::get_font_collections
 */
class Tests_Fonts_WpFontLibrary_GetFontCollections extends WP_UnitTestCase {

	public static function set_up_before_class() {
		$font_library = new WP_Font_Library();

		$my_font_collection_config = array(
			'id'          => 'my-font-collection',
			'name'        => 'My Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => path_join( __DIR__, 'my-font-collection-data.json' ),
		);

		$font_library::register_font_collection( $my_font_collection_config );
	}

	public function test_should_get_the_default_font_collection() {
		$font_collections = WP_Font_Library::get_font_collections();
		$this->assertArrayHasKey( 'default-font-collection', $font_collections, 'Default Google Fonts collection should be registered' );
		$this->assertInstanceOf( 'WP_Font_Collection', $font_collections['default-font-collection'], 'The value of the array $font_collections[id] should be an instance of WP_Font_Collection class.' );
	}

	public function test_should_get_the_right_number_of_collections() {
		$font_collections = WP_Font_Library::get_font_collections();
		$this->assertNotEmpty( $font_collections, 'Sould return an array of font collections.' );
		$this->assertCount( 2, $font_collections, 'Should return an array with one font collection.' );
	}

	public function test_should_get_mock_font_collection() {
		$font_collections = WP_Font_Library::get_font_collections();
		$this->assertArrayHasKey( 'my-font-collection', $font_collections, 'The array should have the key of the registered font collection id.' );
		$this->assertInstanceOf( 'WP_Font_Collection', $font_collections['my-font-collection'], 'The value of the array $font_collections[id] should be an instance of WP_Font_Collection class.' );
	}
}
