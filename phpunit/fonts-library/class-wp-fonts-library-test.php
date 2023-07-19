<?php
/**
 * Tests for Fonts Library class
 *
 * @package Gutenberg
 */

class WP_Fonts_Library_Test extends WP_UnitTestCase {

    function test_get_fonts_directory () {
        $this->assertTrue(
            str_ends_with( WP_Fonts_Library::get_fonts_directory(), '/wp-content/fonts' )
        );
    }

    function test_get_relative_fonts_path () {
        $this->assertTrue(
            str_ends_with( WP_Fonts_Library::get_relative_fonts_path(), '/wp-content/fonts/' )
        );
    }
   
}
