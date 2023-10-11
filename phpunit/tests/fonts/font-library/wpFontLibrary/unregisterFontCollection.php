<?php
/**
 * Test WP_Font_Library::unregister_font_collection().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Library::unregister_font_collection
 */
class Tests_Fonts_WpFontLibrary_UnregisterFontCollection extends WP_UnitTestCase {

	public function set_up() {
		$config = array(
			'id'          => 'mock-col-to-unregister',
			'name'        => 'Mock Collection to be unregistered',
			'description' => 'A mock font collection to be unregistered.',
			'src'         => 'my-collection-data.json',
		);
		WP_Font_Library::register_font_collection( $config );

		$config = array(
			'id'          => 'another-collecction',
			'name'        => 'Mock Collection',
			'description' => 'A mock font collection.',
			'src'         => 'my-mock-data.json',
		);
		WP_Font_Library::register_font_collection( $config );
	}

	public function test_should_unregister_font_collection() {
		// Unregister mock font collection.
		WP_Font_Library::unregister_font_collection( 'mock-col-to-unregister' );
		$collections = WP_Font_Library::get_font_collections();
		$this->assertArrayNotHasKey( 'mock-col-to-unregister', $collections, 'Font collection was not unregistered.' );
		$this->assertArrayHasKey( 'default-font-collection', $collections, 'Font collection was unregistered by mistake.' );
	}
}
