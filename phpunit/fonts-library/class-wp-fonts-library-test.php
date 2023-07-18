<?php
/**
 * Tests for Font Family class
 *
 * @package Gutenberg
 */

class WP_Font_Family_Test extends WP_UnitTestCase {

    function test_get_fonts_directory () {
        $this->assertTrue( str_contains( WP_Font_Family::get_fonts_directory(), '/wp-content/fonts' ) );
    }

}