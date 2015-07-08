<?php

/**
 * @group option
 */
class Tests_Option_Transient extends WP_UnitTestCase {

	function test_the_basics() {
		$key = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_transient( 'doesnotexist' ) );
		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );
		$this->assertFalse( set_transient( $key, $value ) );
		$this->assertTrue( set_transient( $key, $value2 ) );
		$this->assertEquals( $value2, get_transient( $key ) );
		$this->assertTrue( delete_transient( $key ) );
		$this->assertFalse( get_transient( $key ) );
		$this->assertFalse( delete_transient( $key ) );
	}

	function test_serialized_data() {
		$key = rand_str();
		$value = array( 'foo' => true, 'bar' => true );

		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );

		$value = (object) $value;
		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );
		$this->assertTrue( delete_transient( $key ) );
	}

	/**
	 * @ticket 22807
	 */
	function test_transient_data_with_timeout() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING.' );
		}

		$key = rand_str();
		$value = rand_str();

		$this->assertFalse( get_option( '_transient_timeout_' . $key ) );
		$now = time();

		$this->assertTrue( set_transient( $key, $value, 100 ) );

		// Ensure the transient timeout is set for 100-101 seconds in the future.
		$this->assertGreaterThanOrEqual( $now + 100, get_option( '_transient_timeout_' . $key ) );
		$this->assertLessThanOrEqual( $now + 101, get_option( '_transient_timeout_' . $key ) );

		// Update the timeout to a second in the past and watch the transient be invalidated.
		update_option( '_transient_timeout_' . $key, $now - 1 );
		$this->assertFalse( get_transient( $key ) );
	}

	/**
	 * @ticket 22807
	 */
	function test_transient_add_timeout() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING.' );
		}

		$key = rand_str();
		$value = rand_str();
		$value2 = rand_str();
		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );

		$this->assertFalse( get_option( '_transient_timeout_' . $key ) );

		$now = time();
		// Add timeout to existing timeout-less transient.
		$this->assertTrue( set_transient( $key, $value2, 1 ) );
		$this->assertGreaterThanOrEqual( $now, get_option( '_transient_timeout_' . $key ) );

		update_option( '_transient_timeout_' . $key, $now - 1 );
		$this->assertFalse( get_transient( $key ) );
	}

	/**
	 * If get_option( $transient_timeout ) returns false, don't bother trying to delete the transient.
	 *
	 * @ticket 30380
	 */
	function test_nonexistent_key_dont_delete_if_false() {
		// Create a bogus a transient
		$key = 'test_transient';
		set_transient( $key, 'test', 60 * 10 );
		$this->assertEquals( 'test', get_transient( $key ) );

		// Useful variables for tracking
		$transient_timeout = '_transient_timeout_' . $key;

		// Mock an action for tracking action calls
		$a = new MockAction();

		// Make sure the timeout option returns false
		add_filter( 'option_' . $transient_timeout, '__return_false' );

		// Add some actions to make sure options are _not_ deleted
		add_action( 'delete_option', array( $a, 'action' ) );

		// Act
		get_transient( $key );

		// Make sure delete option was not called for both the transient and the timeout
		$this->assertEquals( 0, $a->get_call_count() );
	}

	/**
	 * @ticket 30380
	 */
	function test_nonexistent_key_old_timeout() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING.' );
		}

		// Create a transient
		$key = 'test_transient';
		set_transient( $key, 'test', 60 * 10 );
		$this->assertEquals( 'test', get_transient( $key ) );

		// Make sure the timeout option returns false
		$timeout = '_transient_timeout_' . $key;
		$transient_option = '_transient_' . $key;
		add_filter( 'option_' . $timeout, '__return_zero' );

		// Mock an action for tracking action calls
		$a = new MockAction();

		// Add some actions to make sure options are deleted
		add_action( 'delete_option', array( $a, 'action' ) );

		// Act
		get_transient( $key );

		// Make sure delete option was called for both the transient and the timeout
		$this->assertEquals( 2, $a->get_call_count() );

		$expected = array(
			array(
				'action' => 'action',
				'tag'    => 'delete_option',
				'args'   => array( $transient_option ),
			),
			array(
				'action' => 'action',
				'tag'    => 'delete_option',
				'args'   => array( $timeout ),
			),
		);
		$this->assertEquals( $expected, $a->get_events() );
	}
}
