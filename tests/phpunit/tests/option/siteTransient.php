<?php

/**
 * @group option
 */
class Tests_Option_SiteTransient extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		if ( wp_using_ext_object_cache() ) {
			$this->markTestSkipped( 'Not testable with an external object cache.' );
		}
	}

	function test_the_basics() {
		$key = 'key1';
		$value = 'value1';
		$value2 = 'value2';

		$this->assertFalse( get_site_transient( 'doesnotexist' ) );
		$this->assertTrue( set_site_transient( $key, $value ) );
		$this->assertEquals( $value, get_site_transient( $key ) );
		$this->assertFalse( set_site_transient( $key, $value ) );
		$this->assertTrue( set_site_transient( $key, $value2 ) );
		$this->assertEquals( $value2, get_site_transient( $key ) );
		$this->assertTrue( delete_site_transient( $key ) );
		$this->assertFalse( get_site_transient( $key ) );
		$this->assertFalse( delete_site_transient( $key ) );
	}

	function test_serialized_data() {
		$key = __FUNCTION__;
		$value = array( 'foo' => true, 'bar' => true );

		$this->assertTrue( set_site_transient( $key, $value ) );
		$this->assertEquals( $value, get_site_transient( $key ) );

		$value = (object) $value;
		$this->assertTrue( set_site_transient( $key, $value ) );
		$this->assertEquals( $value, get_site_transient( $key ) );
		$this->assertTrue( delete_site_transient( $key ) );
	}

	/**
	 * @ticket 22846
	 */
	public function test_set_site_transient_is_not_stored_as_autoload_option() {
		$key = 'not_autoloaded';

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Does not apply when used in multisite.' );
		}
		set_site_transient( $key, 'Not an autoload option' );

		$options = wp_load_alloptions();

		$this->assertFalse( isset( $options[ '_site_transient_' . $key ] ) );
	}
}
