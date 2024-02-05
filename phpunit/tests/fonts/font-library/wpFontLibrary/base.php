<?php
/**
 * Test Case for WP_Font_Library tests.
 *
 * @package WordPress
 * @subpackage Font Library
 */
abstract class WP_Font_Library_UnitTestCase extends WP_UnitTestCase {
	public function reset_font_collections() {
		$collections = WP_Font_Library::get_instance()->get_font_collections();
		foreach ( $collections as $slug => $collection ) {
			WP_Font_Library::get_instance()->unregister_font_collection( $slug );
		}
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
