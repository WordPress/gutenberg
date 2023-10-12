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
		// Resets the private static property WP_Font_Library::$collections to empty array.
		$reflection = new ReflectionClass( 'WP_Font_Library' );
		$property   = $reflection->getProperty( 'collections' );
		$property->setAccessible( true );
		$property->setValue( array() );

		// Registers two mock font collections.
		$config = array(
			'id'          => 'mock-font-collection-1',
			'name'        => 'Mock Collection to be unregistered',
			'description' => 'A mock font collection to be unregistered.',
			'src'         => 'my-collection-data.json',
		);
		WP_Font_Library::register_font_collection( $config );

		$config = array(
			'id'          => 'mock-font-collection-2',
			'name'        => 'Mock Collection',
			'description' => 'A mock font collection.',
			'src'         => 'my-mock-data.json',
		);
		WP_Font_Library::register_font_collection( $config );
	}

	public function test_should_unregister_font_collection() {
		// Unregister mock font collection.
		WP_Font_Library::unregister_font_collection( 'mock-font-collection-1' );
		$collections = WP_Font_Library::get_font_collections();
		$this->assertArrayNotHasKey( 'mock-font-collection-1', $collections, 'Font collection was not unregistered.' );

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
