<?php

/**
 * @group option
 */
class Tests_Option_Theme_Mods extends WP_UnitTestCase {

	function test_theme_mod_default() {
		$this->assertEquals( '', get_theme_mod( 'non_existent' ) );
	}

	function test_theme_mod_defined_default() {
		$this->assertEquals( 'default', get_theme_mod( 'non_existent', 'default' ) );
	}

	function test_theme_mod_set() {
		$expected = 'value';
		set_theme_mod( 'test_name', $expected );
		$this->assertEquals( $expected, get_theme_mod( 'test_name' ) );
	}

	function test_theme_mod_update() {
		set_theme_mod( 'test_update', 'first_value' );
		$expected = 'updated_value';
		set_theme_mod( 'test_update', $expected );
		$this->assertEquals( $expected, get_theme_mod( 'test_update' ) );
	}

	function test_theme_mod_remove() {
		set_theme_mod( 'test_remove', 'value' );
		remove_theme_mod( 'test_remove' );
		$this->assertEquals( '', get_theme_mod( 'test_remove' ) );
	}

}
