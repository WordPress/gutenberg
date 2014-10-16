<?php

/**
 * @group option
 */
class Tests_Option_SiteOption extends WP_UnitTestCase {
	function __return_foo() {
		return 'foo';
	}

	function test_the_basics() {
		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_site_option( 'doesnotexist' ) );
		$this->assertTrue( add_site_option( $key, $value ) );
		$this->assertEquals( $value, get_site_option( $key ) );
		$this->assertFalse( add_site_option( $key, $value ) );  // Already exists
		$this->assertFalse( update_site_option( $key, $value ) );  // Value is the same
		$this->assertTrue( update_site_option( $key, $value2 ) );
		$this->assertEquals( $value2, get_site_option( $key ) );
		$this->assertFalse( add_site_option( $key, $value ) );
		$this->assertEquals( $value2, get_site_option( $key ) );
		$this->assertTrue( delete_site_option( $key ) );
		$this->assertFalse( get_site_option( $key ) );
		$this->assertFalse( delete_site_option( $key ) );

		$this->assertTrue( update_site_option( $key2, $value2 ) );
		$this->assertEquals( $value2, get_site_option( $key2 ) );
		$this->assertTrue( delete_site_option( $key2 ) );
		$this->assertFalse( get_site_option( $key2 ) );
	}

	function test_default_filter() {
		$random = rand_str();

		$this->assertFalse( get_site_option( 'doesnotexist' ) );

		// Default filter overrides $default arg.
		add_filter( 'default_site_option_doesnotexist', array( $this, '__return_foo' ) );
		$this->assertEquals( 'foo', get_site_option( 'doesnotexist', 'bar' ) );

		// Remove the filter and the $default arg is honored.
		remove_filter( 'default_site_option_doesnotexist', array( $this, '__return_foo' ) );
		$this->assertEquals( 'bar', get_site_option( 'doesnotexist', 'bar' ) );

		// Once the option exists, the $default arg and the default filter are ignored.
		add_site_option( 'doesnotexist', $random );
		$this->assertEquals( $random, get_site_option( 'doesnotexist', 'foo' ) );
		add_filter( 'default_site_option_doesnotexist', array( $this, '__return_foo' ) );
		$this->assertEquals( $random, get_site_option( 'doesnotexist', 'foo' ) );
		remove_filter( 'default_site_option_doesnotexist', array( $this, '__return_foo' ) );

		// Cleanup
		$this->assertTrue( delete_site_option( 'doesnotexist' ) );
		$this->assertFalse( get_site_option( 'doesnotexist' ) );
	}

	function test_serialized_data() {
		$key = rand_str();
		$value = array( 'foo' => true, 'bar' => true );

		$this->assertTrue( add_site_option( $key, $value ) );
		$this->assertEquals( $value, get_site_option( $key ) );

		$value = (object) $value;
		$this->assertTrue( update_site_option( $key, $value ) );
		$this->assertEquals( $value, get_site_option( $key ) );
		$this->assertTrue( delete_site_option( $key ) );
	}

	// #15497 - ensure update_site_option will add options with false-y values
	function test_update_adds_falsey_value() {
		$key = rand_str();
		$value = 0;

		delete_site_option( $key );
		$this->assertTrue( update_site_option( $key, $value ) );
		wp_cache_flush(); // ensure we're getting the value from the DB
		$this->assertEquals( $value, get_site_option( $key ) );
	}

	// #18955 - ensure get_site_option doesn't cache the default value for non-existent options
	function test_get_doesnt_cache_default_value() {
		$option = rand_str();
		$default = 'a default';

		$this->assertEquals( get_site_option( $option, $default ), $default );
		$this->assertFalse( get_site_option( $option ) );
	}
}
