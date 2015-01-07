<?php

/**
 * @group option
 * @group slashes
 * @ticket 21767
 */
class Tests_Option_Slashes extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		// it is important to test with both even and odd numbered slashes as
		// kses does a strip-then-add slashes in some of its function calls
		$this->slash_1 = 'String with 1 slash \\';
		$this->slash_2 = 'String with 2 slashes \\\\';
		$this->slash_3 = 'String with 3 slashes \\\\\\';
		$this->slash_4 = 'String with 4 slashes \\\\\\\\';
		$this->slash_5 = 'String with 5 slashes \\\\\\\\\\';
		$this->slash_6 = 'String with 6 slashes \\\\\\\\\\\\';
		$this->slash_7 = 'String with 7 slashes \\\\\\\\\\\\\\';
	}

	/**
	 * Tests the model function that expects un-slashed data
	 *
	 */
	function test_add_option() {
		add_option( 'slash_test_1', $this->slash_1 );
		add_option( 'slash_test_2', $this->slash_2 );
		add_option( 'slash_test_3', $this->slash_3 );
		add_option( 'slash_test_4', $this->slash_4 );

		$this->assertEquals( $this->slash_1, get_option( 'slash_test_1' ) );
		$this->assertEquals( $this->slash_2, get_option( 'slash_test_2' ) );
		$this->assertEquals( $this->slash_3, get_option( 'slash_test_3' ) );
		$this->assertEquals( $this->slash_4, get_option( 'slash_test_4' ) );
	}

	/**
	 * Tests the model function that expects un-slashed data
	 *
	 */
	function test_update_option() {
		add_option( 'slash_test_5', 'foo' );

		update_option( 'slash_test_5', $this->slash_1 );
		$this->assertEquals( $this->slash_1, get_option( 'slash_test_5' ) );

		update_option( 'slash_test_5', $this->slash_2 );
		$this->assertEquals( $this->slash_2, get_option( 'slash_test_5' ) );

		update_option( 'slash_test_5', $this->slash_3 );
		$this->assertEquals( $this->slash_3, get_option( 'slash_test_5' ) );

		update_option( 'slash_test_5', $this->slash_4 );
		$this->assertEquals( $this->slash_4, get_option( 'slash_test_5' ) );
	}
}
