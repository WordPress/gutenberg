<?php
/**
 * @group formatting
 * @ticket 22300
 */
class Tests_Formatting_MapDeep extends WP_UnitTestCase {
	function setUp() {
		if ( ! function_exists( 'map_deep' ) ) {
			$this->markTestSkipped( "map_deep function doesn't exist" );
		}

		parent::setUp();
	}

	function test_map_deep_with_any_function_over_empty_array_should_return_empty_array() {
		$this->assertEquals( array(), map_deep( array( $this, 'return_baba' ), array() ) );
	}

	function test_map_deep_should_map_each_element_of_array_one_level_deep() {
		$this->assertEquals( array( 'ababa', 'xbaba' ), map_deep( array( $this, 'append_baba' ), array( 'a', 'x' ) ) );
	}

	function test_map_deep_should_map_each_element_of_array_two_levels_deep() {
		$this->assertEquals( array( 'ababa', array( 'xbaba' ) ), map_deep( array( $this, 'append_baba' ), array( 'a', array( 'x' ) ) ) );
	}

	function test_map_deep_should_map_each_object_element_of_an_array() {
		$this->assertEquals( array( 'var0' => 'ababa', 'var1' => (object)array( 'xbaba' ) ),
			map_deep( array( $this, 'append_baba' ), array( 'var0' => 'a', 'var1' => (object)array( 'x' ) ) ) );
	}

	function test_map_deep_should_apply_the_function_to_a_string() {
		$this->assertEquals( 'xbaba', map_deep( array( $this, 'append_baba' ), 'x' ) );
	}

	function test_map_deep_should_apply_the_function_to_an_integer() {
		$this->assertEquals( '5baba' , map_deep( array( $this, 'append_baba' ), 5 ) );
	}

	function test_map_deep_should_map_each_property_of_an_object() {
		$this->assertEquals( (object)array( 'var0' => 'ababa', 'var1' => 'xbaba' ),
			map_deep( array( $this, 'append_baba' ), (object)array( 'var0' => 'a', 'var1' => 'x' ) ) );
	}

	function test_map_deep_should_map_each_array_property_of_an_object() {
		$this->assertEquals( (object)array( 'var0' => 'ababa', 'var1' => array( 'xbaba' ) ),
			map_deep( array( $this, 'append_baba' ), (object)array( 'var0' => 'a', 'var1' => array( 'x' ) ) ) );
	}

	function test_map_deep_should_map_each_object_property_of_an_object() {
		$this->assertEquals( (object)array( 'var0' => 'ababa', 'var1' => (object)array( 'xbaba' ) ),
			map_deep( array( $this, 'append_baba' ), (object)array( 'var0' => 'a', 'var1' => (object)array( 'x' ) ) ) );
	}

	function return_baba( $value ) {
		return 'baba';
	}

	function append_baba( $value ) {
		return $value . 'baba';
	}
}

