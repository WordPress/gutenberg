<?php
/**
 * Test Case for WP_Font_Library tests.
 *
 * @package WordPress
 * @subpackage Font Library
 */
abstract class WP_Font_Library_UnitTestCase extends WP_UnitTestCase {
	public function reset_font_collections() {
		// Resets the private static property WP_Font_Library::$collections to empty array.
		$reflection = new ReflectionClass( 'WP_Font_Library' );
		$property   = $reflection->getProperty( 'collections' );
		$property->setAccessible( true );
		$property->setValue( array() );
	}

	public function set_up() {
		parent::set_up();
		$this->reset_font_collections();
	}

	public function tear_down() {
		parent::tear_down();
		$this->reset_font_collections();
	}
}
