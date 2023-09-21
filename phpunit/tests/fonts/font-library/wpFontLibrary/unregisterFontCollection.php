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
		$config     = array(
			'id'             => 'mock-col-to-unregister',
			'name'           => 'Mock Collection to be unregistered',
			'description'    => 'A mock font collection to be unregistered.',
			'data_json_file' => 'my-collection-data.json',
		);
		WP_Font_Library::register_font_collection( $config );
	}

	public function test_should_unregister_font_collection() {
		// Unregister mock font collection.
		$result1 = WP_Font_Library::unregister_font_collection( 'mock-col-to-unregister' );
		$this->assertTrue( $result1, 'Should return true if it was unregistered succesfully.' );
		// Try to unregister mock font collection again.
		$result2 = WP_Font_Library::unregister_font_collection( 'mock-col-to-unregister' );
		$this->assertFalse( $result2, 'Should return false because it was already unregistered.' );
	}

	public function test_should_unregister_default_font_collection() {
		// Unregister default font collection.
		$result1 = WP_Font_Library::unregister_font_collection( 'default-font-collection' );
		$this->assertTrue( $result1, 'Should return true if it was unregistered succesfully.' );
		// Try to unregister default font collection again.
		$result2 = WP_Font_Library::unregister_font_collection( 'default-font-collection' );
		$this->assertFalse( $result2, 'Should return false because it was already unregistered.' );
	}

	public function test_should_unregister_non_existing_font_collection() {
		// Unregister default font collection.
		$result = WP_Font_Library::unregister_font_collection( 'fake-collection-id-x1234' );
		$this->assertFalse( $result );
	}
}
