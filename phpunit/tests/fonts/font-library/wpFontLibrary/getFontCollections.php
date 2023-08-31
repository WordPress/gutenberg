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
		$my_font_collection_config = array(
			'id'             => 'my-font-collection',
			'name'           => 'My Font Collection',
			'description'    => 'Demo about how to a font collection to your WordPress Font Library.',
			'data_json_file' => path_join( __DIR__, 'my-font-collection-data.json' ),
		);

		wp_register_font_collection( $my_font_collection_config );

		$another_font_collection_config = array(
			'id'             => 'another-font-collection',
			'name'           => 'Another Font Collection',
			'description'    => 'Demo about how to a font collection to your WordPress Font Library.',
			'data_json_file' => path_join( __DIR__, 'another-font-collection-data.json' ),
		);

		wp_register_font_collection( $another_font_collection_config );
	}

	public function test_should_get_font_collections() {
		$font_collections = WP_Font_Library::get_font_collections();
		$this->assertNotEmpty( $font_collections, 'Sould return an array of font collections.' );
		$this->assertCount( 2, $font_collections, 'Should return an array with one font collection.' );

		$this->assertArrayHasKey( 'my-font-collection', $font_collections, 'The array should have the key of the registered font collection id.' );
		$this->assertInstanceOf( 'WP_Font_Collection', $font_collections['my-font-collection'], 'The value of the array $font_collections[id] should be an instance of WP_Font_Collection class.' );
		$this->assertArrayHasKey( 'another-font-collection', $font_collections, 'The array should have the key of the registered font collection id.' );
		$this->assertInstanceOf( 'WP_Font_Collection', $font_collections['another-font-collection'], 'The value of the array $font_collections[id] should be an instance of WP_Font_Collection class.' );
	}
}
