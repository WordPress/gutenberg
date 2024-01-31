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
class Tests_Fonts_WpFontLibrary_UnregisterFontCollection extends WP_Font_Library_UnitTestCase {

	public function test_should_unregister_font_collection() {
		// Registers two mock font collections.
		WP_Font_Library::register_font_collection( 'mock-font-collection-1', array( 'font_families' => array( 'mock' ) ) );
		WP_Font_Library::register_font_collection( 'mock-font-collection-2', array( 'font_families' => array( 'mock' ) ) );

		// Unregister mock font collection.
		WP_Font_Library::unregister_font_collection( 'mock-font-collection-1' );
		$collections = WP_Font_Library::get_font_collections();
		$this->assertArrayNotHasKey( 'mock-font-collection-1', $collections, 'Font collection was not unregistered.' );
		$this->assertArrayHasKey( 'mock-font-collection-2', $collections, 'Font collection was unregistered by mistake.' );

		// Unregisters remaining mock font collection.
		WP_Font_Library::unregister_font_collection( 'mock-font-collection-2' );
		$collections = WP_Font_Library::get_font_collections();
		$this->assertArrayNotHasKey( 'mock-font-collection-2', $collections, 'Mock font collection was not unregistered.' );

		// Checks that all font collections were unregistered.
		$this->assertEmpty( $collections, 'Font collections were not unregistered.' );
	}

	public function unregister_non_existing_collection() {
		// Unregisters non existing font collection.
		WP_Font_Library::unregister_font_collection( 'non-existing-collection' );
		$collections = WP_Font_Library::get_font_collections();
		$this->assertEmpty( $collections, 'Should not be registered collections.' );
	}
}
